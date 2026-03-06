import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  async getOverview() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0);

    // Parallel queries for better performance
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      pendingLeaveRequests,
      pendingOvertimeRequests,
      expiringContracts,
      attendanceThisMonth,
      totalAttendanceRecords,
      lateCount,
      payrollThisMonth,
    ] = await Promise.all([
      // Total employees
      this.prisma.employee.count(),

      // Active employees
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),

      // Total departments
      this.prisma.department.count(),

      // Pending leave requests
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),

      // Pending overtime requests
      this.prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),

      // Contracts expiring in 30 days
      this.prisma.contract.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Attendance this month
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: 'PRESENT',
        },
      }),

      // Total attendance records this month
      this.prisma.attendance.count({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
      }),

      // Late count this month
      this.prisma.attendance.count({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          isLate: true,
        },
      }),

      // Payroll this month
      this.prisma.payroll.findFirst({
        where: { month: currentMonth, year: currentYear },
        select: { totalAmount: true, status: true },
      }),
    ]);

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((attendanceThisMonth / totalAttendanceRecords) * 100)
      : 0;

    const lateRate = totalAttendanceRecords > 0
      ? Math.round((lateCount / totalAttendanceRecords) * 100)
      : 0;

    return {
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
        },
        departments: {
          total: totalDepartments,
        },
        attendance: {
          thisMonth: attendanceThisMonth,
          rate: attendanceRate,
          lateCount,
          lateRate,
        },
        leaveRequests: {
          pending: pendingLeaveRequests,
        },
        overtimeRequests: {
          pending: pendingOvertimeRequests,
        },
        contracts: {
          expiringSoon: expiringContracts,
        },
        payroll: {
          thisMonth: payrollThisMonth
            ? {
              total: Number(payrollThisMonth.totalAmount),
              status: payrollThisMonth.status,
            }
            : null,
        },
      },
    };
  }

  async getEmployeeStats() {
    // Single query with groupBy for better performance
    const [byDepartment, byStatus, byGender, departments] = await Promise.all([
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        _count: true,
        where: { status: 'ACTIVE' },
      }),
      this.prisma.employee.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['gender'],
        _count: true,
      }),
      // Fetch all departments once
      this.prisma.department.findMany({
        select: { id: true, name: true, code: true },
      }),
    ]);

    // Create department map for O(1) lookup
    const deptMap = new Map(departments.map(d => [d.id, d]));

    return {
      success: true,
      data: {
        byDepartment: byDepartment.map(item => ({
          department: deptMap.get(item.departmentId)?.name || 'Unknown',
          count: item._count,
        })),
        byStatus: byStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        byGender: byGender.map(item => ({
          gender: item.gender,
          count: item._count,
        })),
      },
    };
  }

  async getAttendanceSummary(month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const [total, present, late, earlyLeave, avgWorkHours] = await Promise.all([
      this.prisma.attendance.count({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      this.prisma.attendance.count({
        where: { date: { gte: startDate, lte: endDate }, status: 'PRESENT' },
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

    // Daily attendance trend
    const dailyTrend = await this.prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: startDate, lte: endDate } },
      _count: true,
      orderBy: { date: 'asc' },
    });

    const trend = dailyTrend.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: item._count,
    }));

    return {
      success: true,
      data: {
        summary: {
          total,
          present,
          late,
          earlyLeave,
          presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
          lateRate: total > 0 ? Math.round((late / total) * 100) : 0,
          avgWorkHours: Math.round((Number(avgWorkHours._avg.workHours) || 0) * 100) / 100,
        },
        trend,
      },
      meta: { month: targetMonth, year: targetYear },
    };
  }

  async getPayrollSummary(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const payrolls = await this.prisma.payroll.findMany({
      where: { year: targetYear },
      orderBy: { month: 'asc' },
      select: {
        month: true,
        year: true,
        totalAmount: true,
        status: true,
        _count: { select: { items: true } },
      },
    });

    const summary = payrolls.map((p) => ({
      month: p.month,
      year: p.year,
      totalAmount: Number(p.totalAmount),
      employeeCount: p._count.items,
      status: p.status,
    }));

    const totalPaid = payrolls
      .filter((p) => p.status === 'LOCKED')
      .reduce((sum, p) => sum + Number(p.totalAmount), 0);

    return {
      success: true,
      data: {
        summary,
        totalPaid,
        monthsProcessed: payrolls.length,
      },
      meta: { year: targetYear },
    };
  }

  async getAlerts() {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Use parallel queries with optimized selects
    const [expiringContracts, pendingLeaveRequests, recentLateEmployees, pendingOvertimeCount] = await Promise.all([
      // Contracts expiring soon - with employee data in single query
      this.prisma.contract.findMany({
        where: {
          status: 'ACTIVE',
          endDate: { gte: now, lte: in30Days },
        },
        select: {
          id: true,
          endDate: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy: { endDate: 'asc' },
        take: 10,
      }),

      // Pending leave requests - with employee data in single query
      this.prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          leaveType: true,
          startDate: true,
          totalDays: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),

      // Employees with late check-ins in last 7 days - with employee data
      this.prisma.attendance.groupBy({
        by: ['employeeId'],
        where: {
          date: { gte: sevenDaysAgo },
          isLate: true,
        },
        _count: true,
        orderBy: { _count: { employeeId: 'desc' } },
        take: 10,
      }),

      // Pending overtime count (just count, not full data)
      this.prisma.overtimeRequest.count({
        where: { status: 'PENDING' },
      }),
    ]);

    // Fetch employee details for late employees (only if needed)
    const lateEmployeeIds = recentLateEmployees.map(item => item.employeeId);
    const lateEmployeeDetails = lateEmployeeIds.length > 0
      ? await this.prisma.employee.findMany({
        where: { id: { in: lateEmployeeIds } },
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
        },
      })
      : [];

    const empMap = new Map(lateEmployeeDetails.map(e => [e.id, e]));

    return {
      success: true,
      data: {
        expiringContracts: expiringContracts.map((c) => ({
          contractId: c.id,
          employee: c.employee,
          endDate: c.endDate,
          daysRemaining: c.endDate ? Math.ceil((c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        })),
        pendingLeaveRequests: pendingLeaveRequests.map((lr) => ({
          requestId: lr.id,
          employee: lr.employee,
          leaveType: lr.leaveType,
          startDate: lr.startDate,
          totalDays: lr.totalDays,
          createdAt: lr.createdAt,
        })),
        frequentLateEmployees: recentLateEmployees.map(item => ({
          employee: empMap.get(item.employeeId),
          lateCount: item._count,
        })),
        pendingOvertimeCount,
      },
    };
  }

  async getRecentActivities(limit: number = 10) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch recent activities from different sources
    const [recentEmployees, recentLeaveRequests, recentAttendances] = await Promise.all([
      // Recent employee updates
      this.prisma.employee.findMany({
        where: {
          updatedAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          fullName: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      }),

      // Recent leave requests
      this.prisma.leaveRequest.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          status: true,
          totalDays: true,
          createdAt: true,
          employee: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      // Recent attendance check-ins
      this.prisma.attendance.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          id: true,
          checkOut: true,
          createdAt: true,
          employee: {
            select: { fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and format activities
    const activities: any[] = [];

    // Employee activities
    recentEmployees.forEach((emp) => {
      const isNew = emp.createdAt.getTime() === emp.updatedAt.getTime();
      activities.push({
        id: `emp-${emp.id}`,
        type: isNew ? 'employee_created' : 'employee_updated',
        description: isNew
          ? `Nhân viên mới: ${emp.fullName}`
          : `Cập nhật thông tin: ${emp.fullName}`,
        user: 'HR Manager',
        timestamp: emp.updatedAt,
      });
    });

    // Leave request activities
    recentLeaveRequests.forEach((lr) => {
      activities.push({
        id: `leave-${lr.id}`,
        type: `leave_${lr.status.toLowerCase()}`,
        description: `Đơn nghỉ phép - ${lr.employee.fullName} (${lr.totalDays} ngày)`,
        user: lr.employee.fullName,
        timestamp: lr.createdAt,
      });
    });

    // Attendance activities
    recentAttendances.forEach((att) => {
      activities.push({
        id: `att-${att.id}`,
        type: att.checkOut ? 'attendance_checkout' : 'attendance_checkin',
        description: att.checkOut
          ? `${att.employee.fullName} đã check-out`
          : `${att.employee.fullName} đã check-in`,
        user: att.employee.fullName,
        timestamp: att.createdAt,
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    return {
      success: true,
      data: sortedActivities,
    };
  }

  async getTodaySnapshot() {
    // Use optimized view instead of multiple queries
    const result: any = await this.prisma.$queryRaw`
      SELECT * FROM vw_today_snapshot
    `;

    const snapshot = result[0];

    return {
      success: true,
      data: {
        workingNow: Number(snapshot.working_now),
        lateToday: Number(snapshot.late_today),
        pendingApprovals: Number(snapshot.pending_leaves) + Number(snapshot.pending_overtime),
        expiringContracts: Number(snapshot.expiring_contracts_7days),
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  async getTurnoverStats(months: number = 6) {
    // Use optimized view instead of N+1 queries
    const turnoverData: any = await this.prisma.$queryRaw`
      SELECT
        month,
        year,
        month_num,
        terminations,
        total_employees,
        turnover_rate
      FROM vw_employee_turnover_monthly
      ORDER BY month DESC
      LIMIT ${months}
    `;

    // Get current and last month data
    const thisMonth = turnoverData[0] || { terminations: 0, turnover_rate: 0 };
    const lastMonth = turnoverData[1] || { terminations: 0, turnover_rate: 0 };

    // Calculate change
    const change = lastMonth.terminations > 0
      ? ((Number(thisMonth.terminations) - Number(lastMonth.terminations)) / Number(lastMonth.terminations)) * 100
      : 0;

    // Build trend array (reverse to show oldest to newest)
    const trend = turnoverData
      .reverse()
      .map((row: any) => Number(row.turnover_rate));

    // Get department with highest turnover this month
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const departmentTurnover = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: {
        status: 'INACTIVE',
        updatedAt: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth,
        },
      },
      _count: true,
      orderBy: {
        _count: {
          departmentId: 'desc',
        },
      },
      take: 1,
    });

    let topDepartment = 'N/A';
    if (departmentTurnover.length > 0) {
      const dept = await this.prisma.department.findUnique({
        where: { id: departmentTurnover[0].departmentId },
        select: { name: true },
      });
      topDepartment = dept?.name || 'N/A';
    }

    return {
      success: true,
      data: {
        thisMonth: Number(thisMonth.terminations),
        lastMonth: Number(lastMonth.terminations),
        rate: Number(thisMonth.turnover_rate),
        change: Math.round(change * 10) / 10,
        trend,
        topDepartment,
      },
    };
  }
}
