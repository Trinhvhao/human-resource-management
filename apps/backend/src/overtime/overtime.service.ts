import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { RejectOvertimeDto } from './dto/reject-overtime.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OvertimeService {
  // Vietnamese labor law limits
  private readonly MAX_MONTHLY_OVERTIME = 30; // 30 hours per month
  private readonly MAX_YEARLY_OVERTIME = 200; // 200 hours per year
  private readonly WORK_START = 8 * 60 + 30; // 8:30 AM in minutes
  private readonly WORK_END = 17 * 60 + 30;  // 5:30 PM in minutes

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(employeeId: string, dto: CreateOvertimeDto) {
    // Kiểm tra nhân viên tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // Validate thời gian
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('Giờ kết thúc phải sau giờ bắt đầu');
    }

    // Tính số giờ tăng ca
    const calculatedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Kiểm tra số giờ có khớp không (cho phép sai lệch 0.1h)
    if (Math.abs(calculatedHours - dto.hours) > 0.1) {
      throw new BadRequestException(
        `Số giờ không khớp. Tính toán: ${calculatedHours.toFixed(2)}h, Nhập vào: ${dto.hours}h`,
      );
    }

    // Validate overtime time range (must be outside work hours)
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    // Check if overtime is during work hours (8:30-17:30)
    if (startMinutes >= this.WORK_START && startMinutes < this.WORK_END) {
      throw new BadRequestException('Giờ tăng ca phải ngoài giờ hành chính (8:30-17:30)');
    }

    // Check monthly overtime limit
    const requestDate = new Date(dto.date);
    const month = requestDate.getMonth() + 1;
    const year = requestDate.getFullYear();
    
    const monthlyTotal = await this.getMonthlyOvertimeHours(employeeId, month, year);
    if (monthlyTotal + dto.hours > this.MAX_MONTHLY_OVERTIME) {
      throw new BadRequestException(
        `Vượt quá giới hạn tăng ca tháng (${this.MAX_MONTHLY_OVERTIME}h). Hiện tại: ${monthlyTotal}h, Đăng ký: ${dto.hours}h`,
      );
    }

    // Check yearly overtime limit
    const yearlyTotal = await this.getYearlyOvertimeHours(employeeId, year);
    if (yearlyTotal + dto.hours > this.MAX_YEARLY_OVERTIME) {
      throw new BadRequestException(
        `Vượt quá giới hạn tăng ca năm (${this.MAX_YEARLY_OVERTIME}h). Hiện tại: ${yearlyTotal}h, Đăng ký: ${dto.hours}h`,
      );
    }

    // Kiểm tra đã có đơn tăng ca cho ngày này chưa
    const existingRequest = await this.prisma.overtimeRequest.findFirst({
      where: {
        employeeId,
        date: new Date(dto.date),
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Đã có đơn tăng ca cho ngày này');
    }

    // Tạo đơn tăng ca
    return this.prisma.overtimeRequest.create({
      data: {
        employeeId,
        date: new Date(dto.date),
        startTime,
        endTime,
        hours: dto.hours,
        reason: dto.reason,
        status: 'PENDING',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(status?: string, employeeId?: string, month?: number, year?: number) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.prisma.overtimeRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findPending() {
    return this.findAll('PENDING');
  }

  async findByEmployee(employeeId: string) {
    return this.findAll(undefined, employeeId);
  }

  async findOne(id: string) {
    const overtime = await this.prisma.overtimeRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            baseSalary: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!overtime) {
      throw new NotFoundException('Đơn tăng ca không tồn tại');
    }

    return overtime;
  }

  async approve(id: string, approverId: string) {
    const overtime = await this.findOne(id);

    if (overtime.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể duyệt đơn đang chờ xử lý');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { 
        employee: {
          select: { fullName: true }
        }
      },
    });

    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Send email notification
    await this.mailService.sendOvertimeApproved(overtime.employee.email, {
      employeeName: overtime.employee.fullName,
      date: overtime.date.toLocaleDateString('vi-VN'),
      hours: Number(overtime.hours),
      approverName: approver?.employee?.fullName || 'HR Manager',
    });

    return updated;
  }

  async reject(id: string, approverId: string, dto: RejectOvertimeDto) {
    const overtime = await this.findOne(id);

    if (overtime.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể từ chối đơn đang chờ xử lý');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { 
        employee: {
          select: { fullName: true }
        }
      },
    });

    const updated = await this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        approvedAt: new Date(),
        rejectedReason: dto.rejectedReason,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Send email notification
    await this.mailService.sendOvertimeRejected(overtime.employee.email, {
      employeeName: overtime.employee.fullName,
      date: overtime.date.toLocaleDateString('vi-VN'),
      hours: Number(overtime.hours),
      approverName: approver?.employee?.fullName || 'HR Manager',
      reason: dto.rejectedReason,
    });

    return updated;
  }

  async cancel(id: string, employeeId: string) {
    const overtime = await this.findOne(id);

    // Chỉ nhân viên tạo đơn mới được hủy
    if (overtime.employeeId !== employeeId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn này');
    }

    if (overtime.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy đơn đang chờ xử lý');
    }

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  // Tính tổng giờ tăng ca đã duyệt trong tháng
  async getApprovedOvertimeHours(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.prisma.overtimeRequest.aggregate({
      where: {
        employeeId,
        status: 'APPROVED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        hours: true,
      },
    });

    return result._sum.hours || 0;
  }

  // Tính tổng giờ tăng ca trong tháng (bao gồm PENDING và APPROVED)
  private async getMonthlyOvertimeHours(employeeId: string, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.prisma.overtimeRequest.aggregate({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        hours: true,
      },
    });

    return Number(result._sum.hours) || 0;
  }

  // Tính tổng giờ tăng ca trong năm (bao gồm PENDING và APPROVED)
  private async getYearlyOvertimeHours(employeeId: string, year: number): Promise<number> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const result = await this.prisma.overtimeRequest.aggregate({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        hours: true,
      },
    });

    return Number(result._sum.hours) || 0;
  }

  // Báo cáo tăng ca theo tháng
  async getMonthlyReport(month: number, year: number) {
    const overtimeRequests = await this.findAll(undefined, undefined, month, year);

    const summary = {
      totalRequests: overtimeRequests.length,
      pending: overtimeRequests.filter((r) => r.status === 'PENDING').length,
      approved: overtimeRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: overtimeRequests.filter((r) => r.status === 'REJECTED').length,
      totalHours: overtimeRequests
        .filter((r) => r.status === 'APPROVED')
        .reduce((sum, r) => sum + Number(r.hours), 0),
      byEmployee: {} as Record<string, any>,
    };

    // Group by employee
    overtimeRequests.forEach((request) => {
      const empId = request.employee.id;
      if (!summary.byEmployee[empId]) {
        summary.byEmployee[empId] = {
          employee: request.employee,
          totalHours: 0,
          requests: 0,
        };
      }
      if (request.status === 'APPROVED') {
        summary.byEmployee[empId].totalHours += Number(request.hours);
      }
      summary.byEmployee[empId].requests += 1;
    });

    return {
      month,
      year,
      summary,
      requests: overtimeRequests,
    };
  }
}
