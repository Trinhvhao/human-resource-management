import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollDto, UpdatePayrollItemDto } from './dto/payroll.dto';
import { HolidaysService } from '../holidays/holidays.service';
import { OvertimeService } from '../overtime/overtime.service';
import { SalaryComponentsService } from '../salary-components/salary-components.service';

@Injectable()
export class PayrollsService {
  // Tax brackets (simplified Vietnamese PIT)
  private readonly TAX_BRACKETS = [
    { limit: 5000000, rate: 0.05 },
    { limit: 10000000, rate: 0.10 },
    { limit: 18000000, rate: 0.15 },
    { limit: 32000000, rate: 0.20 },
    { limit: 52000000, rate: 0.25 },
    { limit: 80000000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 },
  ];

  private readonly INSURANCE_RATE = 0.105; // 10.5% employee contribution
  private readonly INSURANCE_CAP = 36000000; // 36M VND cap (2024)
  private readonly PERSONAL_DEDUCTION = 11000000; // 11M VND
  private readonly OVERTIME_RATE = 1.5;

  constructor(
    private prisma: PrismaService,
    private holidaysService: HolidaysService,
    private overtimeService: OvertimeService,
    private salaryComponentsService: SalaryComponentsService,
  ) {}

  async create(dto: CreatePayrollDto) {
    // Check if payroll exists
    const existing = await this.prisma.payroll.findFirst({
      where: { month: dto.month, year: dto.year },
    });
    if (existing) {
      throw new ConflictException(`Payroll for ${dto.month}/${dto.year} already exists`);
    }

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        attendances: {
          where: {
            date: {
              gte: new Date(dto.year, dto.month - 1, 1),
              lte: new Date(dto.year, dto.month, 0),
            },
            status: 'PRESENT',
          },
        },
        rewards: {
          where: {
            rewardDate: {
              gte: new Date(dto.year, dto.month - 1, 1),
              lte: new Date(dto.year, dto.month, 0),
            },
          },
        },
        disciplines: {
          where: {
            disciplineDate: {
              gte: new Date(dto.year, dto.month - 1, 1),
              lte: new Date(dto.year, dto.month, 0),
            },
          },
        },
      },
    });

    // Create payroll
    const payroll = await this.prisma.payroll.create({
      data: {
        month: dto.month,
        year: dto.year,
        status: 'DRAFT',
        totalAmount: 0,
      },
    });

    // Get work days for the month
    const workDays = await this.holidaysService.getWorkDaysInMonth(dto.month, dto.year);

    // Calculate salary for each employee
    let totalAmount = 0;
    const payrollItems: any[] = [];

    for (const emp of employees) {
      const item = await this.calculateSalary(emp, dto.month, dto.year, workDays);
      payrollItems.push({
        ...item,
        payrollId: payroll.id,
        employeeId: emp.id,
      });
      totalAmount += item.netSalary;
    }

    // Create payroll items
    await this.prisma.payrollItem.createMany({ data: payrollItems });

    // Update total amount
    await this.prisma.payroll.update({
      where: { id: payroll.id },
      data: { totalAmount },
    });

    return {
      success: true,
      message: `Payroll created for ${dto.month}/${dto.year}`,
      data: {
        ...payroll,
        totalAmount,
        employeeCount: payrollItems.length,
      },
    };
  }

  async findAll(query: { year?: number; status?: string }) {
    const { year, status } = query;
    const where: any = {};
    if (year) where.year = year;
    if (status) where.status = status;

    const payrolls = await this.prisma.payroll.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return { success: true, data: payrolls };
  }

  async findOne(id: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: { id: true, employeeCode: true, fullName: true, department: { select: { name: true } } },
            },
          },
        },
      },
    });

    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }

    return { success: true, data: payroll };
  }

  async updateItem(payrollId: string, itemId: string, dto: UpdatePayrollItemDto) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });
    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Cannot update finalized payroll');
    }

    const item = await this.prisma.payrollItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.payrollId !== payrollId) {
      throw new NotFoundException('Payroll item not found');
    }

    // Recalculate with new values
    const allowances = dto.allowances ?? Number(item.allowances);
    const bonus = dto.bonus ?? Number(item.bonus);
    const deduction = dto.deduction ?? Number(item.deduction);
    const overtimeHours = dto.overtimeHours ?? Number(item.overtimeHours);

    const baseSalary = Number(item.baseSalary);
    const hourlyRate = baseSalary / (item.workDays * 8);
    const overtimePay = overtimeHours * hourlyRate * this.OVERTIME_RATE;

    const grossSalary = baseSalary * (Number(item.actualWorkDays) / item.workDays) + allowances + bonus - deduction + overtimePay;
    const insurance = grossSalary * this.INSURANCE_RATE;
    const taxableIncome = Math.max(0, grossSalary - insurance - this.PERSONAL_DEDUCTION);
    const tax = this.calculateTax(taxableIncome);
    const netSalary = grossSalary - insurance - tax;

    const updated = await this.prisma.payrollItem.update({
      where: { id: itemId },
      data: {
        allowances,
        bonus,
        deduction,
        overtimeHours,
        overtimePay,
        insurance,
        tax,
        netSalary,
        notes: dto.notes,
      },
    });

    // Update payroll total
    const items = await this.prisma.payrollItem.findMany({
      where: { payrollId },
    });
    const totalAmount = items.reduce((sum, i) => sum + Number(i.netSalary), 0);
    await this.prisma.payroll.update({
      where: { id: payrollId },
      data: { totalAmount },
    });

    return {
      success: true,
      message: 'Payroll item updated',
      data: updated,
    };
  }

  async finalize(id: string, userId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
    });
    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }
    if (payroll.status === 'FINALIZED') {
      throw new BadRequestException('Payroll already finalized');
    }

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: {
        status: 'FINALIZED',
        finalizedAt: new Date(),
        finalizedBy: userId,
      },
    });

    return {
      success: true,
      message: 'Payroll finalized',
      data: updated,
    };
  }

  async getPayslip(employeeId: string, month: number, year: number) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { month, year },
    });
    if (!payroll) {
      throw new NotFoundException(`No payroll found for ${month}/${year}`);
    }

    const item = await this.prisma.payrollItem.findFirst({
      where: { payrollId: payroll.id, employeeId },
      include: {
        employee: {
          select: {
            id: true, employeeCode: true, fullName: true, position: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Payslip not found');
    }

    return {
      success: true,
      data: {
        payroll: { month, year, status: payroll.status },
        ...item,
      },
    };
  }

  private async calculateSalary(employee: any, month: number, year: number, workDays: number) {
    // Get total salary from salary components (BASIC + allowances)
    let baseSalary = Number(employee.baseSalary);
    let allowances = 0;
    
    try {
      const salaryData = await this.salaryComponentsService.findByEmployee(employee.id);
      if (salaryData.data) {
        baseSalary = salaryData.data.totalSalary || baseSalary;
        // Calculate allowances (all components except BASIC)
        allowances = salaryData.data.components
          .filter((c: any) => c.componentType !== 'BASIC')
          .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
      }
    } catch (error) {
      // Fallback to employee.baseSalary if salary components not found
      console.warn(`Salary components not found for employee ${employee.id}, using baseSalary`);
    }

    const actualWorkDays = employee.attendances?.length || 0;

    // Rewards and disciplines
    const rewardBonus = employee.rewards?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    const disciplineDeduction = employee.disciplines?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;

    // Get approved overtime hours
    const overtimeHours = await this.overtimeService.getApprovedOvertimeHours(employee.id, month, year);
    const hourlyRate = baseSalary / (workDays * 8); // 8 hours per day
    const overtimePay = Number(overtimeHours) * hourlyRate * this.OVERTIME_RATE;

    const proRatedSalary = baseSalary * (actualWorkDays / workDays);
    const grossSalary = proRatedSalary + rewardBonus - disciplineDeduction + overtimePay;

    // Insurance with cap at 36M VND
    const insuranceBase = Math.min(grossSalary, this.INSURANCE_CAP);
    const insurance = insuranceBase * this.INSURANCE_RATE;
    
    const taxableIncome = Math.max(0, grossSalary - insurance - this.PERSONAL_DEDUCTION);
    const tax = this.calculateTax(taxableIncome);
    const netSalary = grossSalary - insurance - tax;

    return {
      baseSalary,
      workDays,
      actualWorkDays,
      allowances: Math.round(allowances),
      bonus: rewardBonus,
      deduction: disciplineDeduction,
      overtimeHours,
      overtimePay: Math.round(overtimePay),
      insurance: Math.round(insurance),
      tax: Math.round(tax),
      netSalary: Math.round(netSalary),
    };
  }

  private calculateTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    let tax = 0;
    let remaining = taxableIncome;
    let prevLimit = 0;

    for (const bracket of this.TAX_BRACKETS) {
      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit);
      if (taxableInBracket <= 0) break;

      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
      prevLimit = bracket.limit;
    }

    return tax;
  }
}
