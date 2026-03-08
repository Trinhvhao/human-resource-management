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
  private readonly MIN_PART_TIME_HOURS_FOR_INSURANCE = 20; // 20 hours/week minimum for part-time insurance

  constructor(
    private prisma: PrismaService,
    private holidaysService: HolidaysService,
    private overtimeService: OvertimeService,
    private salaryComponentsService: SalaryComponentsService,
  ) { }

  async create(dto: CreatePayrollDto) {
    // Check if payroll exists
    const existing = await this.prisma.payroll.findFirst({
      where: { month: dto.month, year: dto.year },
    });
    if (existing) {
      throw new ConflictException(`Payroll for ${dto.month}/${dto.year} already exists`);
    }

    console.log(`🔄 Starting payroll creation for ${dto.month}/${dto.year}...`);

    // Get all active employees with their related data in one query
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
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

    console.log(`📋 Found ${employees.length} active employees`);

    // Batch load all salary components
    const salaryComponentsMap = new Map();
    try {
      const allSalaryComponents = await this.prisma.salaryComponent.findMany({
        where: {
          employeeId: { in: employees.map(e => e.id) },
          isActive: true,
        },
      });

      // Group by employeeId
      for (const sc of allSalaryComponents) {
        if (!salaryComponentsMap.has(sc.employeeId)) {
          salaryComponentsMap.set(sc.employeeId, []);
        }
        salaryComponentsMap.get(sc.employeeId).push(sc);
      }
    } catch (error) {
      console.warn('Failed to load salary components, using base salaries');
    }

    // Batch load all overtime hours
    const overtimeMap = new Map();
    try {
      const allOvertimes = await this.prisma.overtimeRequest.findMany({
        where: {
          employeeId: { in: employees.map(e => e.id) },
          status: 'APPROVED',
          date: {
            gte: new Date(dto.year, dto.month - 1, 1),
            lte: new Date(dto.year, dto.month, 0),
          },
        },
      });

      // Sum by employeeId
      for (const ot of allOvertimes) {
        const current = overtimeMap.get(ot.employeeId) || 0;
        overtimeMap.set(ot.employeeId, current + Number(ot.hours));
      }
    } catch (error) {
      console.warn('Failed to load overtime data');
    }

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

    // Calculate salary for each employee (now with pre-loaded data)
    let totalAmount = 0;
    const payrollItems: any[] = [];

    for (const emp of employees) {
      const salaryComponents = salaryComponentsMap.get(emp.id) || [];
      const overtimeHours = overtimeMap.get(emp.id) || 0;

      const item = this.calculateSalaryOptimized(
        emp,
        dto.month,
        dto.year,
        workDays,
        salaryComponents,
        overtimeHours
      );

      payrollItems.push({
        ...item,
        payrollId: payroll.id,
        employeeId: emp.id,
      });
      totalAmount += item.netSalary;
    }

    // Create payroll items in batch
    await this.prisma.payrollItem.createMany({ data: payrollItems });

    // Update total amount
    await this.prisma.payroll.update({
      where: { id: payroll.id },
      data: { totalAmount },
    });

    console.log(`✅ Payroll created: ${payrollItems.length} employees, total: ${totalAmount}`);

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
    if (payroll.status === 'LOCKED') {
      throw new BadRequestException('Cannot update locked payroll');
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

    // Insurance calculation based on base salary + allowances (not including bonus, overtime)
    const insuranceBase = Math.min(baseSalary + allowances, this.INSURANCE_CAP);
    const insurance = insuranceBase * this.INSURANCE_RATE;

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

  // Optimized version that uses pre-loaded data
  private calculateSalaryOptimized(
    employee: any,
    month: number,
    year: number,
    workDays: number,
    salaryComponents: any[],
    overtimeHours: number
  ) {
    const activeContract = employee.contracts?.[0] || null;

    // Calculate from pre-loaded salary components
    let baseSalary = Number(employee.baseSalary);
    let allowances = 0;

    if (salaryComponents.length > 0) {
      const totalSalary = salaryComponents.reduce((sum, sc) => sum + Number(sc.amount), 0);
      baseSalary = totalSalary;
      allowances = salaryComponents
        .filter(sc => sc.componentType !== 'BASIC')
        .reduce((sum, sc) => sum + Number(sc.amount), 0);
    }

    const actualWorkDays = employee.attendances?.length || 0;
    let effectiveWorkDays = actualWorkDays;
    let hasAttendanceWarning = false;

    if (actualWorkDays === 0) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const wasActive = employee.startDate <= monthEnd &&
        (!employee.endDate || employee.endDate >= monthStart);

      if (wasActive) {
        effectiveWorkDays = workDays;
        hasAttendanceWarning = true;
      }
    }

    const rewardBonus = employee.rewards?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    const disciplineDeduction = employee.disciplines?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;

    const hourlyRate = baseSalary / (workDays * 8);
    const overtimePay = Number(overtimeHours) * hourlyRate * this.OVERTIME_RATE;

    const proRatedSalary = baseSalary * (effectiveWorkDays / workDays);
    const grossSalary = proRatedSalary + rewardBonus - disciplineDeduction + overtimePay;

    let insurance = 0;
    let insuranceExempt = false;
    let insuranceExemptReason = '';

    if (activeContract && this.shouldPayInsurance(activeContract)) {
      const insuranceBase = Math.min(baseSalary + allowances, this.INSURANCE_CAP);
      insurance = insuranceBase * this.INSURANCE_RATE;
    } else {
      insuranceExempt = true;
      if (!activeContract) {
        insuranceExemptReason = 'Không có hợp đồng';
      } else if (activeContract.contractType === 'PROBATION') {
        insuranceExemptReason = 'Hợp đồng thử việc';
      } else if (['SEASONAL', 'SPECIFIC_TASK'].includes(activeContract.contractType)) {
        insuranceExemptReason = `Hợp đồng ${activeContract.contractType === 'SEASONAL' ? 'theo mùa vụ' : 'theo công việc'}`;
      } else if (activeContract.contractType === 'FIXED_TERM') {
        insuranceExemptReason = 'Hợp đồng ngắn hạn (< 3 tháng)';
      } else if (activeContract.workType === 'PART_TIME' && activeContract.workHoursPerWeek < this.MIN_PART_TIME_HOURS_FOR_INSURANCE) {
        insuranceExemptReason = `Part-time < ${this.MIN_PART_TIME_HOURS_FOR_INSURANCE}h/tuần (${activeContract.workHoursPerWeek}h)`;
      }
    }

    const taxableIncome = Math.max(0, grossSalary - insurance - this.PERSONAL_DEDUCTION);
    const tax = this.calculateTax(taxableIncome);
    const netSalary = grossSalary - insurance - tax;

    return {
      baseSalary,
      workDays,
      actualWorkDays,
      effectiveWorkDays,
      hasAttendanceWarning,
      allowances: Math.round(allowances),
      bonus: rewardBonus,
      deduction: disciplineDeduction,
      overtimeHours,
      overtimePay: Math.round(overtimePay),
      insurance: Math.round(insurance),
      insuranceExempt,
      insuranceExemptReason,
      tax: Math.round(tax),
      netSalary: Math.round(netSalary),
    };
  }

  async finalize(id: string, userId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id },
    });
    if (!payroll) {
      throw new NotFoundException('Payroll not found');
    }
    if (payroll.status === 'LOCKED') {
      throw new BadRequestException('Payroll already locked');
    }

    const updated = await this.prisma.payroll.update({
      where: { id },
      data: {
        status: 'LOCKED',
        finalizedAt: new Date(),
        finalizedBy: userId,
      },
    });

    return {
      success: true,
      message: 'Payroll locked',
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
    // Get active contract
    const activeContract = employee.contracts?.[0] || null;

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

    // ⚠️ SAFETY CHECK: If no attendance records, use expected work days
    let effectiveWorkDays = actualWorkDays;
    let hasAttendanceWarning = false;

    if (actualWorkDays === 0) {
      // Check if employee was active during the month
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      // Employee was active if:
      // - Started before or during the month
      // - AND (no end date OR ended after or during the month)
      const wasActive = employee.startDate <= monthEnd &&
        (!employee.endDate || employee.endDate >= monthStart);

      if (wasActive) {
        // Employee was active but no attendance records
        // Use expected work days to avoid 0 salary
        effectiveWorkDays = workDays;
        hasAttendanceWarning = true;

        console.warn(
          `⚠️ Employee ${employee.id} (${employee.fullName}) has no attendance records for ${month}/${year}. ` +
          `Using expected work days (${workDays}) for payroll calculation.`
        );
      }
    }

    // Rewards and disciplines
    const rewardBonus = employee.rewards?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0;
    const disciplineDeduction = employee.disciplines?.reduce((sum: number, d: any) => sum + Number(d.amount), 0) || 0;

    // Get approved overtime hours
    const overtimeHours = await this.overtimeService.getApprovedOvertimeHours(employee.id, month, year);
    const hourlyRate = baseSalary / (workDays * 8); // 8 hours per day
    const overtimePay = Number(overtimeHours) * hourlyRate * this.OVERTIME_RATE;

    const proRatedSalary = baseSalary * (effectiveWorkDays / workDays);
    const grossSalary = proRatedSalary + rewardBonus - disciplineDeduction + overtimePay;

    // ========================================
    // INSURANCE CALCULATION (Business Logic)
    // ========================================
    let insurance = 0;
    let insuranceExempt = false;
    let insuranceExemptReason = '';

    // Check if employee should pay insurance based on contract
    if (activeContract && this.shouldPayInsurance(activeContract)) {
      // Insurance calculation based on base salary + allowances (not including bonus, overtime)
      // According to Vietnamese law, insurance is calculated on fixed salary components only
      const insuranceBase = Math.min(baseSalary + allowances, this.INSURANCE_CAP);
      insurance = insuranceBase * this.INSURANCE_RATE;
    } else {
      insuranceExempt = true;

      // Determine exemption reason
      if (!activeContract) {
        insuranceExemptReason = 'Không có hợp đồng';
      } else if (activeContract.contractType === 'PROBATION') {
        insuranceExemptReason = 'Hợp đồng thử việc';
      } else if (['SEASONAL', 'SPECIFIC_TASK'].includes(activeContract.contractType)) {
        insuranceExemptReason = `Hợp đồng ${activeContract.contractType === 'SEASONAL' ? 'theo mùa vụ' : 'theo công việc'}`;
      } else if (activeContract.contractType === 'FIXED_TERM') {
        insuranceExemptReason = 'Hợp đồng ngắn hạn (< 3 tháng)';
      } else if (activeContract.workType === 'PART_TIME' && activeContract.workHoursPerWeek < this.MIN_PART_TIME_HOURS_FOR_INSURANCE) {
        insuranceExemptReason = `Part-time < ${this.MIN_PART_TIME_HOURS_FOR_INSURANCE}h/tuần (${activeContract.workHoursPerWeek}h)`;
      }
    }

    const taxableIncome = Math.max(0, grossSalary - insurance - this.PERSONAL_DEDUCTION);
    const tax = this.calculateTax(taxableIncome);
    const netSalary = grossSalary - insurance - tax;

    return {
      baseSalary,
      workDays,
      actualWorkDays,
      effectiveWorkDays, // NEW: Actual work days used for calculation
      hasAttendanceWarning, // NEW: Flag for HR review
      allowances: Math.round(allowances),
      bonus: rewardBonus,
      deduction: disciplineDeduction,
      overtimeHours,
      overtimePay: Math.round(overtimePay),
      insurance: Math.round(insurance),
      insuranceExempt, // NEW: Flag if insurance is exempted
      insuranceExemptReason, // NEW: Reason for exemption
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

  /**
   * Determine if employee should pay social insurance based on contract type and work hours
   * According to Vietnamese Labor Law and Social Insurance Law
   * 
   * @param contract - Employee's active contract
   * @returns boolean - true if employee must pay insurance
   */
  private shouldPayInsurance(contract: any): boolean {
    if (!contract) {
      // No contract = no insurance (safety check)
      return false;
    }

    // PROBATION contracts: NO insurance required
    if (contract.contractType === 'PROBATION') {
      return false;
    }

    // SEASONAL or SPECIFIC_TASK contracts: NO insurance required
    if (['SEASONAL', 'SPECIFIC_TASK'].includes(contract.contractType)) {
      return false;
    }

    // FIXED_TERM contracts less than 3 months: NO insurance required
    if (contract.contractType === 'FIXED_TERM') {
      const startDate = new Date(contract.startDate);
      const endDate = contract.endDate ? new Date(contract.endDate) : null;

      if (endDate) {
        const durationMonths = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (durationMonths < 3) {
          return false;
        }
      }
    }

    // PART_TIME with less than 20 hours/week: NO insurance required
    if (contract.workType === 'PART_TIME' && contract.workHoursPerWeek < this.MIN_PART_TIME_HOURS_FOR_INSURANCE) {
      return false;
    }

    // All other cases: Insurance REQUIRED
    // - INDEFINITE contracts (full-time or part-time >= 20h)
    // - FIXED_TERM >= 3 months (full-time or part-time >= 20h)
    return true;
  }

  // Employee Payslip Methods
  async getEmployeePayslips(employeeId: string) {
    const items = await this.prisma.payrollItem.findMany({
      where: { employeeId },
      include: {
        payroll: {
          select: { id: true, month: true, year: true, status: true, createdAt: true },
        },
      },
      orderBy: [
        { payroll: { year: 'desc' } },
        { payroll: { month: 'desc' } },
      ],
      take: 12, // Last 12 months
    });

    return {
      success: true,
      data: items.map(item => ({
        ...item,
        month: item.payroll.month,
        year: item.payroll.year,
        status: item.payroll.status,
        payrollId: item.payroll.id,
      })),
    };
  }

  async getEmployeePayslipDetail(employeeId: string, itemId: string) {
    const item = await this.prisma.payrollItem.findFirst({
      where: { id: itemId, employeeId },
      include: {
        payroll: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            position: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Phiếu lương không tìm thấy');
    }

    return { success: true, data: item };
  }

  async getYTDSummary(employeeId: string, year: number) {
    const items = await this.prisma.payrollItem.findMany({
      where: {
        employeeId,
        payroll: { year },
      },
      include: {
        payroll: { select: { month: true } },
      },
      orderBy: {
        payroll: { month: 'asc' },
      },
    });

    const summary = {
      year,
      employeeId,
      totalGrossIncome: 0,
      totalNetIncome: 0,
      totalTaxPaid: 0,
      totalInsurancePaid: 0,
      totalOvertimePay: 0,
      totalBonuses: 0,
      totalDeductions: 0,
      monthlyBreakdown: [] as any[],
      monthsCount: items.length,
    };

    items.forEach(item => {
      const grossIncome = Number(item.baseSalary) + Number(item.allowances) +
        Number(item.bonus) + Number(item.overtimePay);
      const insurancePaid = Number(item.insurance);
      const taxPaid = Number(item.tax);

      summary.totalGrossIncome += grossIncome;
      summary.totalNetIncome += Number(item.netSalary);
      summary.totalTaxPaid += taxPaid;
      summary.totalInsurancePaid += insurancePaid;
      summary.totalOvertimePay += Number(item.overtimePay);
      summary.totalBonuses += Number(item.bonus);
      summary.totalDeductions += Number(item.deduction);

      summary.monthlyBreakdown.push({
        month: item.payroll.month,
        grossIncome: Math.round(grossIncome),
        netIncome: Math.round(Number(item.netSalary)),
        taxPaid: Math.round(taxPaid),
        insurancePaid: Math.round(insurancePaid),
      });
    });

    // Round totals
    summary.totalGrossIncome = Math.round(summary.totalGrossIncome);
    summary.totalNetIncome = Math.round(summary.totalNetIncome);
    summary.totalTaxPaid = Math.round(summary.totalTaxPaid);
    summary.totalInsurancePaid = Math.round(summary.totalInsurancePaid);
    summary.totalOvertimePay = Math.round(summary.totalOvertimePay);
    summary.totalBonuses = Math.round(summary.totalBonuses);
    summary.totalDeductions = Math.round(summary.totalDeductions);

    return { success: true, data: summary };
  }

  // =====================================================
  // PAYROLL WORKFLOW METHODS
  // =====================================================

  async submitForApproval(payrollId: string, userId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { items: true },
    });

    if (!payroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    if (payroll.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ có thể gửi duyệt bảng lương ở trạng thái DRAFT');
    }

    if (!payroll.items || payroll.items.length === 0) {
      throw new BadRequestException('Bảng lương không có nhân viên nào');
    }

    const updated = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
        submittedBy: userId,
      },
    });

    // Get all ADMIN users to notify
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
    });

    // Send email to all admins
    for (const admin of admins) {
      // TODO: Send email using MailService
      // await this.mailService.sendMail(...)
    }

    return {
      success: true,
      message: 'Đã gửi bảng lương để duyệt',
      data: updated,
    };
  }

  async approvePayroll(payrollId: string, userId: string, dto: { notes?: string }) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { items: true },
    });

    if (!payroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    if (payroll.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chỉ có thể duyệt bảng lương ở trạng thái PENDING_APPROVAL');
    }

    const updated = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: dto.notes || payroll.notes,
      },
    });

    // Get submitter to notify
    if (payroll.submittedBy) {
      const submitter = await this.prisma.user.findUnique({
        where: { id: payroll.submittedBy },
      });

      if (submitter) {
        // TODO: Send email using MailService
        // await this.mailService.sendMail(...)
      }
    }

    return {
      success: true,
      message: 'Đã duyệt bảng lương',
      data: updated,
    };
  }

  async rejectPayroll(payrollId: string, userId: string, dto: { reason: string }) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    if (payroll.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chỉ có thể từ chối bảng lương ở trạng thái PENDING_APPROVAL');
    }

    const updated = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    // Get submitter to notify
    if (payroll.submittedBy) {
      const submitter = await this.prisma.user.findUnique({
        where: { id: payroll.submittedBy },
      });

      if (submitter) {
        // TODO: Send email using MailService
        // await this.mailService.sendMail(...)
      }
    }

    return {
      success: true,
      message: 'Đã từ chối bảng lương',
      data: updated,
    };
  }

  async lockPayroll(payrollId: string, userId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    if (payroll.status !== 'APPROVED') {
      throw new BadRequestException('Chỉ có thể khóa bảng lương ở trạng thái APPROVED');
    }

    const updated = await this.prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedBy: userId,
      },
    });

    // Get all HR_MANAGER and ADMIN users to notify
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: ['HR_MANAGER', 'ADMIN'] },
        isActive: true,
      },
    });

    // Send email to all HR managers and admins
    for (const user of users) {
      // TODO: Send email using MailService
      // await this.mailService.sendMail(...)
    }

    return {
      success: true,
      message: 'Đã khóa bảng lương',
      data: updated,
    };
  }

  async createRevision(payrollId: string, userId: string, dto: { reason: string }) {
    const originalPayroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { items: true },
    });

    if (!originalPayroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    if (originalPayroll.status !== 'LOCKED') {
      throw new BadRequestException('Chỉ có thể tạo phiên bản mới từ bảng lương đã khóa');
    }

    // Create new payroll with incremented version
    const newPayroll = await this.prisma.payroll.create({
      data: {
        month: originalPayroll.month,
        year: originalPayroll.year,
        status: 'DRAFT',
        totalAmount: originalPayroll.totalAmount,
        version: originalPayroll.version + 1,
        previousVersionId: originalPayroll.id,
        notes: `Phiên bản ${originalPayroll.version + 1} - ${dto.reason}`,
      },
    });

    // Copy all payroll items
    const newItems = originalPayroll.items.map((item) => ({
      payrollId: newPayroll.id,
      employeeId: item.employeeId,
      baseSalary: item.baseSalary,
      workDays: item.workDays,
      actualWorkDays: item.actualWorkDays,
      allowances: item.allowances,
      bonus: item.bonus,
      deduction: item.deduction,
      overtimeHours: item.overtimeHours,
      overtimePay: item.overtimePay,
      insurance: item.insurance,
      tax: item.tax,
      netSalary: item.netSalary,
      notes: item.notes,
    }));

    await this.prisma.payrollItem.createMany({ data: newItems });

    return {
      success: true,
      message: `Đã tạo phiên bản ${newPayroll.version} của bảng lương`,
      data: newPayroll,
    };
  }

  async getApprovalHistory(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
    });

    if (!payroll) {
      throw new NotFoundException('Không tìm thấy bảng lương');
    }

    const history: any[] = [];

    // Created
    history.push({
      action: 'CREATED',
      timestamp: payroll.createdAt,
      status: 'DRAFT',
    });

    // Submitted
    if (payroll.submittedAt) {
      const submitter = payroll.submittedBy
        ? await this.prisma.user.findUnique({
          where: { id: payroll.submittedBy },
          select: { email: true },
        })
        : null;

      history.push({
        action: 'SUBMITTED',
        timestamp: payroll.submittedAt,
        performedBy: submitter?.email,
        status: 'PENDING_APPROVAL',
      });
    }

    // Approved
    if (payroll.approvedAt) {
      const approver = payroll.approvedBy
        ? await this.prisma.user.findUnique({
          where: { id: payroll.approvedBy },
          select: { email: true },
        })
        : null;

      history.push({
        action: 'APPROVED',
        timestamp: payroll.approvedAt,
        performedBy: approver?.email,
        status: 'APPROVED',
      });
    }

    // Rejected
    if (payroll.rejectedAt) {
      const rejector = payroll.rejectedBy
        ? await this.prisma.user.findUnique({
          where: { id: payroll.rejectedBy },
          select: { email: true },
        })
        : null;

      history.push({
        action: 'REJECTED',
        timestamp: payroll.rejectedAt,
        performedBy: rejector?.email,
        reason: payroll.rejectionReason,
        status: 'REJECTED',
      });
    }

    // Locked
    if (payroll.lockedAt) {
      const locker = payroll.lockedBy
        ? await this.prisma.user.findUnique({
          where: { id: payroll.lockedBy },
          select: { email: true },
        })
        : null;

      history.push({
        action: 'LOCKED',
        timestamp: payroll.lockedAt,
        performedBy: locker?.email,
        status: 'LOCKED',
      });
    }

    // Sort by timestamp
    history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      success: true,
      data: {
        payrollId,
        month: payroll.month,
        year: payroll.year,
        currentStatus: payroll.status,
        version: payroll.version,
        history,
      },
    };
  }

  async bulkApprove(payrollIds: string[], userId: string, notes?: string) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const payrollId of payrollIds) {
      try {
        await this.approvePayroll(payrollId, userId, { notes });
        results.success.push(payrollId);
      } catch (error) {
        results.failed.push({
          id: payrollId,
          reason: error.message,
        });
      }
    }

    return {
      success: true,
      message: `Đã duyệt ${results.success.length}/${payrollIds.length} bảng lương`,
      data: results,
    };
  }
}
