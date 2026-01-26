import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendancesService {
  // Work hours config
  private readonly WORK_START = 8 * 60 + 30; // 8:30 AM in minutes
  private readonly WORK_END = 17 * 60 + 30;  // 5:30 PM in minutes
  private readonly LATE_THRESHOLD = 15;       // 15 minutes grace period

  constructor(private prisma: PrismaService) {}

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
      throw new BadRequestException('Already checked in today');
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isLate = currentMinutes > this.WORK_START + this.LATE_THRESHOLD;

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
      message: isLate ? 'Checked in (Late)' : 'Checked in successfully',
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
      throw new BadRequestException('No check-in record found for today');
    }

    if (!attendance.checkIn) {
      throw new BadRequestException('Must check in before checking out');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Already checked out today');
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isEarlyLeave = currentMinutes < this.WORK_END;

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
      message: isEarlyLeave ? 'Checked out (Early)' : 'Checked out successfully',
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
}
