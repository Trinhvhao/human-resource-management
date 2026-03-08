import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaveBalancesService {
  private readonly DEFAULT_ANNUAL_LEAVE = 12;
  private readonly DEFAULT_SICK_LEAVE = 30;

  constructor(private prisma: PrismaService) { }

  /**
   * Cron job: Chạy tự động vào 00:00 ngày 1 hàng tháng
   * Tích lũy 1 ngày phép cho tất cả nhân viên ACTIVE
   */
  @Cron('0 0 1 * *', {
    name: 'monthly-leave-accrual',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleMonthlyLeaveAccrual() {
    console.log('🔔 Cron job triggered: Monthly leave accrual');
    try {
      await this.accrueLeaveForAllEmployees();
      console.log('✅ Monthly leave accrual completed successfully');
    } catch (error) {
      console.error('❌ Monthly leave accrual failed:', error);
    }
  }

  async initBalance(employeeId: string, year: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check if balance exists
    const existing = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year } },
    });

    if (existing) {
      throw new BadRequestException(`Leave balance for ${year} already exists`);
    }

    const balance = await this.prisma.leaveBalance.create({
      data: {
        employeeId,
        year,
        annualLeave: this.DEFAULT_ANNUAL_LEAVE,
        sickLeave: this.DEFAULT_SICK_LEAVE,
        usedAnnual: 0,
        usedSick: 0,
        carriedOver: 0,
      },
    });

    return {
      success: true,
      message: 'Leave balance initialized',
      data: {
        ...balance,
        remainingAnnual: balance.annualLeave + balance.carriedOver - balance.usedAnnual,
        remainingSick: balance.sickLeave - balance.usedSick,
      },
    };
  }

  async getBalance(employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year: targetYear } },
    });

    // Auto-init if not exists
    if (!balance) {
      const result = await this.initBalance(employeeId, targetYear);
      balance = result.data;
    }

    return {
      success: true,
      data: {
        ...balance,
        remainingAnnual: balance.annualLeave + balance.carriedOver - balance.usedAnnual,
        remainingSick: balance.sickLeave - balance.usedSick,
      },
    };
  }

  async getAllBalances(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const balances = await this.prisma.leaveBalance.findMany({
      where: { year: targetYear },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    });

    const data = balances.map(b => ({
      ...b,
      remainingAnnual: b.annualLeave + b.carriedOver - b.usedAnnual,
      remainingSick: b.sickLeave - b.usedSick,
    }));

    return {
      success: true,
      data,
      meta: { year: targetYear, total: balances.length },
    };
  }

  async deductDays(employeeId: string, days: number, leaveType: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year: targetYear } },
    });

    if (!balance) {
      const result = await this.initBalance(employeeId, targetYear);
      balance = result.data;
    }

    const remainingAnnual = balance.annualLeave + balance.carriedOver - balance.usedAnnual;
    const remainingSick = balance.sickLeave - balance.usedSick;

    // Check if sufficient balance based on leave type
    if (leaveType === 'ANNUAL' || leaveType === 'PERSONAL') {
      if (remainingAnnual < days) {
        throw new BadRequestException(`Insufficient annual leave balance. Available: ${remainingAnnual} days`);
      }

      const updated = await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedAnnual: balance.usedAnnual + days },
      });
      return updated;
    } else if (leaveType === 'SICK') {
      if (remainingSick < days) {
        throw new BadRequestException(`Insufficient sick leave balance. Available: ${remainingSick} days`);
      }

      const updated = await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedSick: balance.usedSick + days },
      });
      return updated;
    }

    // For other types, deduct from annual leave
    if (remainingAnnual < days) {
      throw new BadRequestException(`Insufficient leave balance. Available: ${remainingAnnual} days`);
    }

    const updated = await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { usedAnnual: balance.usedAnnual + days },
    });
    return updated;
  }

  async addDays(employeeId: string, days: number, leaveType: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year: targetYear } },
    });

    if (!balance) {
      const result = await this.initBalance(employeeId, targetYear);
      balance = result.data;
    }

    if (leaveType === 'SICK') {
      const updated = await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedSick: Math.max(0, balance.usedSick - days) },
      });
      return updated;
    } else {
      const updated = await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedAnnual: Math.max(0, balance.usedAnnual - days) },
      });
      return updated;
    }
  }

  async updateBalance(employeeId: string, year: number, annualLeave: number, sickLeave?: number) {
    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year } },
    });

    if (!balance) {
      const result = await this.initBalance(employeeId, year);
      balance = result.data;
    }

    const updated = await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        annualLeave,
        ...(sickLeave !== undefined && { sickLeave }),
      },
    });

    return {
      success: true,
      message: 'Leave balance updated',
      data: {
        ...updated,
        remainingAnnual: updated.annualLeave + updated.carriedOver - updated.usedAnnual,
        remainingSick: updated.sickLeave - updated.usedSick,
      },
    };
  }

  // ==================== LEAVE ACCRUAL METHODS ====================

  /**
   * Tích lũy phép tự động cho tất cả nhân viên ACTIVE
   * Mỗi tháng: +1 ngày phép năm
   */
  async accrueLeaveForAllEmployees(triggeredBy?: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    console.log(`🔄 Starting leave accrual for ${month}/${year}...`);

    // Get all active employees with their balances in one query
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        leaveBalances: {
          where: { year },
          select: { id: true, annualLeave: true }
        }
      },
    });

    console.log(`📋 Found ${employees.length} active employees`);

    // Check existing accruals in batch
    const existingAccruals = await this.prisma.leaveAccrualHistory.findMany({
      where: {
        employeeId: { in: employees.map(e => e.id) },
        year,
        month,
        accrualType: 'AUTO',
      },
      select: { employeeId: true }
    });

    const accrualedEmployeeIds = new Set(existingAccruals.map(a => a.employeeId));

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    // Prepare batch operations
    const balanceUpdates: any[] = [];
    const historyCreates: any[] = [];
    const balanceCreates: any[] = [];
    const daysToAdd = 1;

    for (const employee of employees) {
      try {
        // Skip if already accrued
        if (accrualedEmployeeIds.has(employee.id)) {
          console.log(`⏭️  Skipped ${employee.employeeCode} - Already accrued`);
          results.skipped++;
          continue;
        }

        let balance = employee.leaveBalances[0];

        // If no balance exists, prepare to create it
        if (!balance) {
          balanceCreates.push({
            employeeId: employee.id,
            year,
            annualLeave: 12 + daysToAdd, // Default 12 + 1 for this month
            sickLeave: 30,
            carriedOver: 0,
            usedAnnual: 0,
            usedSick: 0,
          });

          historyCreates.push({
            employeeId: employee.id,
            year,
            month,
            daysAdded: daysToAdd,
            balanceBefore: 12,
            balanceAfter: 12 + daysToAdd,
            accrualType: 'AUTO',
            triggeredBy,
            notes: `Tích lũy tự động tháng ${month}/${year}`,
          });

          results.success++;
          results.details.push({
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            balanceBefore: 12,
            balanceAfter: 12 + daysToAdd,
            daysAdded: daysToAdd,
          });
        } else {
          // Prepare balance update
          const balanceBefore = balance.annualLeave;
          const balanceAfter = balanceBefore + daysToAdd;

          balanceUpdates.push({
            where: { id: balance.id },
            data: { annualLeave: balanceAfter },
          });

          historyCreates.push({
            employeeId: employee.id,
            year,
            month,
            daysAdded: daysToAdd,
            balanceBefore,
            balanceAfter,
            accrualType: 'AUTO',
            triggeredBy,
            notes: `Tích lũy tự động tháng ${month}/${year}`,
          });

          results.success++;
          results.details.push({
            employeeCode: employee.employeeCode,
            fullName: employee.fullName,
            balanceBefore,
            balanceAfter,
            daysAdded: daysToAdd,
          });
        }
      } catch (error) {
        console.error(`❌ Failed for ${employee.employeeCode}:`, error.message);
        results.failed++;
      }
    }

    // Execute all operations in a single transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        // Create new balances
        if (balanceCreates.length > 0) {
          await tx.leaveBalance.createMany({
            data: balanceCreates,
            skipDuplicates: true,
          });
        }

        // Update existing balances in batch
        for (const update of balanceUpdates) {
          await tx.leaveBalance.update(update);
        }

        // Create all history records in batch
        if (historyCreates.length > 0) {
          await tx.leaveAccrualHistory.createMany({
            data: historyCreates,
          });
        }
      });

      console.log(`✅ Batch operations completed successfully`);
    } catch (error) {
      console.error(`❌ Transaction failed:`, error.message);
      throw error;
    }

    console.log(`\n✅ Accrual completed: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`);

    return {
      success: true,
      message: `Leave accrual completed for ${month}/${year}`,
      data: results,
    };
  }

  /**
   * Tích lũy phép thủ công cho 1 nhân viên
   */
  async accrueLeaveForEmployee(
    employeeId: string,
    daysToAdd: number,
    triggeredBy: string,
    notes?: string,
  ) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, employeeCode: true, fullName: true, status: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Get or create balance
    let balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year } },
    });

    if (!balance) {
      const result = await this.initBalance(employeeId, year);
      balance = result.data;
    }

    const balanceBefore = balance.annualLeave;
    const balanceAfter = balanceBefore + daysToAdd;

    // Update balance
    await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { annualLeave: balanceAfter },
    });

    // Create history record
    await this.prisma.leaveAccrualHistory.create({
      data: {
        employeeId,
        year,
        month,
        daysAdded: daysToAdd,
        balanceBefore,
        balanceAfter,
        accrualType: 'MANUAL',
        triggeredBy,
        notes: notes || `Tích lũy thủ công bởi HR`,
      },
    });

    return {
      success: true,
      message: 'Leave accrued successfully',
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
        },
        balanceBefore,
        balanceAfter,
        daysToAdd,
      },
    };
  }

  /**
   * Lấy lịch sử tích lũy phép
   */
  async getAccrualHistory(employeeId?: string, year?: number, month?: number) {
    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (year) {
      where.year = year;
    }

    if (month) {
      where.month = month;
    }

    const history = await this.prisma.leaveAccrualHistory.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      data: history,
      meta: {
        total: history.length,
        filters: { employeeId, year, month },
      },
    };
  }
}
