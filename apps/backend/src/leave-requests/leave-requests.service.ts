import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveBalancesService } from '../leave-balances/leave-balances.service';
import { HolidaysService } from '../holidays/holidays.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class LeaveRequestsService {
  constructor(
    private prisma: PrismaService,
    private leaveBalancesService: LeaveBalancesService,
    private holidaysService: HolidaysService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateLeaveRequestDto, userId: string, userEmployeeId?: string) {
    const employeeId = dto.employeeId || userEmployeeId;
    if (!employeeId) {
      throw new BadRequestException('Employee ID is required');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping leave requests
    const overlapping = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } }
            ]
          }
        ]
      }
    });

    if (overlapping) {
      throw new BadRequestException(
        `Leave request overlaps with existing request (${overlapping.startDate.toLocaleDateString('vi-VN')} - ${overlapping.endDate.toLocaleDateString('vi-VN')})`
      );
    }

    // Check minimum notice period (3 days for annual leave, except sick leave)
    if (dto.leaveType === 'ANNUAL') {
      const daysDiff = Math.floor((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 3) {
        throw new BadRequestException('Annual leave requires at least 3 days notice');
      }
    }

    // Calculate total days (excluding weekends and holidays)
    const totalDays = await this.calculateWorkDays(startDate, endDate);

    // Check leave balance
    const year = startDate.getFullYear();
    const balanceResult = await this.leaveBalancesService.getBalance(employeeId, year);
    const remainingDays = balanceResult.data.remainingAnnual || 0;
    
    if (remainingDays < totalDays) {
      throw new BadRequestException(`Insufficient leave balance. Available: ${remainingDays} days`);
    }

    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
        status: 'PENDING',
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, department: { select: { name: true } } },
        },
      },
    });

    return {
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest,
    };
  }

  async findAll(query: { employeeId?: string; status?: string; page?: number; limit?: number }) {
    const { employeeId, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: { id: true, employeeCode: true, fullName: true, department: { select: { name: true } } },
          },
          approver: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return {
      success: true,
      data: requests,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPending() {
    const requests = await this.prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, department: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: requests,
      meta: { total: requests.length },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true, employeeCode: true, fullName: true, email: true,
            department: { select: { id: true, name: true } },
          },
        },
        approver: {
          select: { id: true, email: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    return { success: true, data: request };
  }

  async findByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const requests = await this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: requests };
  }

  async approve(id: string, approverId: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, email: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only approve pending requests');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { employee: { select: { fullName: true } } },
    });

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, email: true },
        },
      },
    });

    // Create attendance records for leave days
    await this.createLeaveAttendances(request.employeeId, request.startDate, request.endDate);

    // Deduct from leave balance
    await this.leaveBalancesService.deductDays(
      request.employeeId,
      request.totalDays,
      request.leaveType,
      request.startDate.getFullYear(),
    );

    // Send email notification
    await this.mailService.sendLeaveApproved(request.employee.email, {
      employeeName: request.employee.fullName,
      leaveType: request.leaveType,
      startDate: request.startDate.toLocaleDateString('vi-VN'),
      endDate: request.endDate.toLocaleDateString('vi-VN'),
      days: request.totalDays,
      approverName: approver?.employee?.fullName || 'HR Manager',
    });

    return {
      success: true,
      message: 'Leave request approved',
      data: updated,
    };
  }

  async reject(id: string, approverId: string, reason?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, email: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only reject pending requests');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { employee: { select: { fullName: true } } },
    });

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
    });

    // Send email notification
    await this.mailService.sendLeaveRejected(request.employee.email, {
      employeeName: request.employee.fullName,
      leaveType: request.leaveType,
      startDate: request.startDate.toLocaleDateString('vi-VN'),
      endDate: request.endDate.toLocaleDateString('vi-VN'),
      days: request.totalDays,
      approverName: approver?.employee?.fullName || 'HR Manager',
      reason: reason || 'Không có lý do cụ thể',
    });

    return {
      success: true,
      message: 'Leave request rejected',
      data: updated,
    };
  }

  async cancel(id: string, userId: string, userEmployeeId?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    // Only owner or HR can cancel
    if (request.employeeId !== userEmployeeId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending requests');
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return {
      success: true,
      message: 'Leave request cancelled',
      data: updated,
    };
  }

  private async calculateWorkDays(startDate: Date, endDate: Date): Promise<number> {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = await this.holidaysService.isHoliday(new Date(current));

      if (!isWeekend && !isHoliday) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  private async createLeaveAttendances(employeeId: string, startDate: Date, endDate: Date) {
    const current = new Date(startDate);
    const attendances: any[] = [];

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        attendances.push({
          employeeId,
          date: new Date(current),
          status: 'LEAVE',
          workHours: 0,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    if (attendances.length > 0) {
      await this.prisma.attendance.createMany({
        data: attendances,
        skipDuplicates: true,
      });
    }
  }
}
