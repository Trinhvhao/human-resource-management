import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendancesService {
  // Work hours config
  private readonly WORK_START = 8 * 60 + 30; // 8:30 AM in minutes
  private readonly WORK_END = 17 * 60 + 30;  // 5:30 PM in minutes
  private readonly LATE_THRESHOLD = 15;       // 15 minutes grace period

  constructor(private prisma: PrismaService) { }

  async checkIn(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    if (existing?.checkIn) {
      throw new BadRequestException('Bạn đã chấm công vào hôm nay rồi');
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Late if: after grace period  OR  before 6 AM (midnight/early area — test data or night shift edge case)
    const isLate = currentMinutes > this.WORK_START + this.LATE_THRESHOLD || currentMinutes < 6 * 60;

    const attendance = existing
      ? await this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkIn: now, isLate, status: 'PRESENT' },
      })
      : await this.prisma.attendance.create({
        data: {
          employeeId,
          date: today,
          checkIn: now,
          isLate,
          status: 'PRESENT',
        },
      });

    return {
      success: true,
      message: isLate ? 'Chấm công vào thành công (Đi muộn)' : 'Chấm công vào thành công',
      data: {
        ...attendance,
        isLate,
        checkInTime: now.toLocaleTimeString('vi-VN'),
      },
    };
  }

  async checkOut(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    if (!attendance) {
      throw new BadRequestException('Bạn chưa chấm công vào hôm nay');
    }

    if (!attendance.checkIn) {
      throw new BadRequestException('Bạn chưa chấm công vào, không thể chấm công ra');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Bạn đã chấm công ra hôm nay rồi');
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    // Only flag early leave for times within normal business hours (6 AM – WORK_END)
    const isEarlyLeave = currentMinutes >= 6 * 60 && currentMinutes < this.WORK_END;

    // Calculate work hours
    const checkInTime = new Date(attendance.checkIn);
    let workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Deduct lunch break (1 hour) if worked more than 4 hours
    if (workHours > 4) {
      workHours -= 1;
    }

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        isEarlyLeave,
        workHours: Math.round(workHours * 100) / 100,
      },
    });

    return {
      success: true,
      message: isEarlyLeave ? 'Chấm công ra thành công (Về sớm)' : 'Chấm công ra thành công',
      data: {
        ...updated,
        checkOutTime: now.toLocaleTimeString('vi-VN'),
        workHours: Math.round(workHours * 100) / 100,
      },
    };
  }

  async getTodayAttendance(employeeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: today,
      },
    });

    return {
      success: true,
      data: attendance || { status: 'NOT_CHECKED_IN' },
    };
  }

  async getTodayAllAttendances() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: today,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { checkIn: 'asc' },
    });

    return {
      success: true,
      data: attendances,
    };
  }

  async getEmployeeAttendances(employeeId: string, month?: number, year?: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate summary
    const summary = {
      totalDays: attendances.length,
      presentDays: attendances.filter(a => a.status === 'PRESENT').length,
      lateDays: attendances.filter(a => a.isLate).length,
      earlyLeaveDays: attendances.filter(a => a.isEarlyLeave).length,
      totalWorkHours: attendances.reduce((sum, a) => sum + (Number(a.workHours) || 0), 0),
    };

    return {
      success: true,
      data: attendances,
      summary,
      meta: { month: targetMonth, year: targetYear },
    };
  }

  async getMonthlyReport(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
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
      orderBy: [{ employeeId: 'asc' }, { date: 'asc' }],
    });

    // Group by employee
    const byEmployee = new Map<string, any>();
    attendances.forEach(att => {
      const empId = att.employeeId;
      if (!byEmployee.has(empId)) {
        byEmployee.set(empId, {
          employee: att.employee,
          attendances: [],
          summary: { present: 0, late: 0, earlyLeave: 0, totalHours: 0 },
        });
      }
      const emp = byEmployee.get(empId);
      emp.attendances.push(att);
      if (att.status === 'PRESENT') emp.summary.present++;
      if (att.isLate) emp.summary.late++;
      if (att.isEarlyLeave) emp.summary.earlyLeave++;
      emp.summary.totalHours += Number(att.workHours) || 0;
    });

    return {
      success: true,
      data: Array.from(byEmployee.values()),
      meta: { month, year, totalRecords: attendances.length },
    };
  }

  async getStatistics(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const [totalRecords, lateCount, earlyLeaveCount, avgWorkHours] = await Promise.all([
      this.prisma.attendance.count({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: startDate, lte: endDate }, isLate: true },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: startDate, lte: endDate }, isEarlyLeave: true },
      }),
      this.prisma.attendance.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _avg: { workHours: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalRecords,
        lateCount,
        earlyLeaveCount,
        lateRate: totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0,
        earlyLeaveRate: totalRecords > 0 ? Math.round((earlyLeaveCount / totalRecords) * 100) : 0,
        avgWorkHours: Math.round((Number(avgWorkHours._avg.workHours) || 0) * 100) / 100,
      },
      meta: { month: targetMonth, year: targetYear },
    };
  }

  async getAbsenteeismStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate date ranges
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 6); // Last 7 days

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    const endOfLastWeek = new Date(startOfWeek);
    endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

    // Get total active employees
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    // Today's stats
    const [todayAbsent, todayLate, todayTotal] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          date: today,
          status: 'ABSENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: today,
          isLate: true,
        },
      }),
      this.prisma.attendance.count({
        where: { date: today },
      }),
    ]);

    // Week's stats (last 7 days)
    const [weekAbsent, weekLate, weekTotal] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfWeek, lte: today },
          status: 'ABSENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfWeek, lte: today },
          isLate: true,
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfWeek, lte: today },
        },
      }),
    ]);

    // Month's stats
    const [monthAbsent, monthLate, monthTotal] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: 'ABSENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          isLate: true,
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    // Last week's stats for trend calculation
    const [lastWeekAbsent, lastWeekTotal] = await Promise.all([
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfLastWeek, lte: endOfLastWeek },
          status: 'ABSENT',
        },
      }),
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfLastWeek, lte: endOfLastWeek },
        },
      }),
    ]);

    // Calculate rates
    const todayAbsentRate = todayTotal > 0 ? (todayAbsent / todayTotal) * 100 : 0;
    const todayLateRate = todayTotal > 0 ? (todayLate / todayTotal) * 100 : 0;

    const weekAbsentRate = weekTotal > 0 ? (weekAbsent / weekTotal) * 100 : 0;
    const lastWeekAbsentRate = lastWeekTotal > 0 ? (lastWeekAbsent / lastWeekTotal) * 100 : 0;

    // Calculate trend (negative = improvement)
    const trend = lastWeekAbsentRate > 0
      ? ((weekAbsentRate - lastWeekAbsentRate) / lastWeekAbsentRate) * 100
      : 0;

    return {
      success: true,
      data: {
        today: {
          absent: todayAbsent,
          late: todayLate,
          absentRate: Math.round(todayAbsentRate * 10) / 10,
          lateRate: Math.round(todayLateRate * 10) / 10,
        },
        week: {
          absent: weekAbsent,
          late: weekLate,
          absentRate: Math.round(weekAbsentRate * 10) / 10,
        },
        month: {
          absent: monthAbsent,
          late: monthLate,
          absentRate: Math.round((monthAbsent / monthTotal) * 100 * 10) / 10,
        },
        trend: Math.round(trend * 10) / 10, // % change vs last week
        totalEmployees,
      },
    };
  }

  /**
   * CRON JOB: Auto-mark absent employees
   * Runs daily at 7 PM (19:00) Vietnam time
   * Marks employees as ABSENT if they didn't check-in and have no approved leave
   */
  @Cron('0 0 19 * * *', {
    name: 'auto-mark-absent',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async autoMarkAbsent() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`[Cron] Starting auto-absent marking for ${today.toLocaleDateString('vi-VN')}`);

    // Get all active employees
    const activeEmployees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        department: {
          select: { name: true },
        },
      },
    });

    const absentEmployees: any[] = [];
    const employeesWithLeave: any[] = [];

    for (const employee of activeEmployees) {
      // Check if attendance record exists
      const attendance = await this.prisma.attendance.findUnique({
        where: {
          unique_employee_date: {
            employeeId: employee.id,
            date: today,
          },
        },
      });

      // If no attendance record
      if (!attendance) {
        // Check if employee has approved leave for today
        const leave = await this.prisma.leaveRequest.findFirst({
          where: {
            employeeId: employee.id,
            status: 'APPROVED',
            startDate: { lte: today },
            endDate: { gte: today },
          },
        });

        if (leave) {
          // Employee has approved leave - skip
          employeesWithLeave.push({
            ...employee,
            leaveType: leave.leaveType,
          });
        } else {
          // No leave - mark as absent
          await this.prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: today,
              status: 'ABSENT',
              notes: 'Tự động đánh vắng (không check-in)',
            },
          });

          absentEmployees.push(employee);
        }
      }
    }

    console.log(`[Cron] Auto-marked ${absentEmployees.length} employees as absent`);
    console.log(`[Cron] ${employeesWithLeave.length} employees on approved leave`);
    console.log(`[Cron] ${activeEmployees.length - absentEmployees.length - employeesWithLeave.length} employees checked in`);

    return {
      success: true,
      message: `Auto-marked ${absentEmployees.length} employees as absent`,
      data: {
        date: today,
        totalActive: activeEmployees.length,
        markedAbsent: absentEmployees.length,
        onLeave: employeesWithLeave.length,
        checkedIn: activeEmployees.length - absentEmployees.length - employeesWithLeave.length,
        absentEmployees: absentEmployees.map(e => ({
          id: e.id,
          code: e.employeeCode,
          name: e.fullName,
          department: e.department?.name,
        })),
      },
    };
  }

  /**
   * Validate attendance data for a month
   * Checks for missing days and incomplete records
   */
  async validateAttendanceData(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: endDate },
        OR: [
          { endDate: null },
          { endDate: { gte: startDate } },
        ],
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        startDate: true,
        endDate: true,
        department: {
          select: { name: true },
        },
      },
    });

    const issues: any[] = [];

    for (const employee of employees) {
      // Calculate expected work days for this employee
      const empStartDate = employee.startDate > startDate ? employee.startDate : startDate;
      const empEndDate = employee.endDate && employee.endDate < endDate ? employee.endDate : endDate;

      const expectedDays = await this.calculateExpectedWorkDays(empStartDate, empEndDate);

      // Count attendance records
      const attendanceCount = await this.prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: empStartDate, lte: empEndDate },
        },
      });

      // Check for missing days
      if (attendanceCount < expectedDays) {
        issues.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.fullName,
          department: employee.department?.name,
          expectedDays,
          actualDays: attendanceCount,
          missingDays: expectedDays - attendanceCount,
          severity: 'WARNING',
          type: 'MISSING_DAYS',
        });
      }

      // Check for incomplete records (check-in but no check-out)
      const incompleteRecords = await this.prisma.attendance.count({
        where: {
          employeeId: employee.id,
          date: { gte: empStartDate, lte: empEndDate },
          checkIn: { not: null },
          checkOut: null,
          status: 'PRESENT', // Only check PRESENT status
        },
      });

      if (incompleteRecords > 0) {
        issues.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          employeeName: employee.fullName,
          department: employee.department?.name,
          incompleteRecords,
          severity: 'ERROR',
          type: 'INCOMPLETE_RECORDS',
        });
      }
    }

    return {
      success: true,
      data: {
        month,
        year,
        totalEmployees: employees.length,
        issuesFound: issues.length,
        issues: issues.sort((a, b) => {
          // Sort by severity (ERROR first, then WARNING)
          if (a.severity === 'ERROR' && b.severity === 'WARNING') return -1;
          if (a.severity === 'WARNING' && b.severity === 'ERROR') return 1;
          return 0;
        }),
      },
    };
  }

  /**
   * Calculate expected work days between two dates
   * Excludes weekends and holidays
   */
  private async calculateExpectedWorkDays(startDate: Date, endDate: Date): Promise<number> {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Check if it's a holiday
      const holiday = await this.prisma.holiday.findUnique({
        where: { date: new Date(current) },
      });

      if (!isWeekend && !holiday) {
        count++;
      }

      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
