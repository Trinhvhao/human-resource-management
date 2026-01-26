import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { ApproveAttendanceCorrectionDto } from './dto/approve-correction.dto';
import { RejectAttendanceCorrectionDto } from './dto/reject-correction.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AttendanceCorrectionsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(employeeId: string, dto: CreateAttendanceCorrectionDto) {
    // Kiểm tra nhân viên tồn tại
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    // Kiểm tra ngày không được trong tương lai
    const requestDate = new Date(dto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestDate > today) {
      throw new BadRequestException('Không thể điều chỉnh chấm công trong tương lai');
    }

    // Kiểm tra phải có ít nhất 1 trong 2: check-in hoặc check-out
    if (!dto.requestedCheckIn && !dto.requestedCheckOut) {
      throw new BadRequestException('Phải cung cấp ít nhất giờ check-in hoặc check-out');
    }

    // Tìm bản ghi attendance hiện tại (nếu có)
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        unique_employee_date: {
          employeeId,
          date: requestDate,
        },
      },
    });

    // Kiểm tra đã có yêu cầu điều chỉnh PENDING cho ngày này chưa
    const pendingCorrection = await this.prisma.attendanceCorrection.findFirst({
      where: {
        employeeId,
        date: requestDate,
        status: 'PENDING',
      },
    });

    if (pendingCorrection) {
      throw new BadRequestException('Đã có yêu cầu điều chỉnh đang chờ duyệt cho ngày này');
    }

    // Tạo yêu cầu điều chỉnh
    return this.prisma.attendanceCorrection.create({
      data: {
        employeeId,
        attendanceId: existingAttendance?.id,
        date: requestDate,
        originalCheckIn: existingAttendance?.checkIn,
        originalCheckOut: existingAttendance?.checkOut,
        requestedCheckIn: dto.requestedCheckIn ? new Date(dto.requestedCheckIn) : null,
        requestedCheckOut: dto.requestedCheckOut ? new Date(dto.requestedCheckOut) : null,
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
        attendance: true,
      },
    });
  }

  async findAll(status?: string, employeeId?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    return this.prisma.attendanceCorrection.findMany({
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
        attendance: true,
      },
      orderBy: {
        createdAt: 'desc',
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
    const correction = await this.prisma.attendanceCorrection.findUnique({
      where: { id },
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
        attendance: true,
      },
    });

    if (!correction) {
      throw new NotFoundException('Yêu cầu điều chỉnh không tồn tại');
    }

    return correction;
  }

  async approve(id: string, approverId: string, dto?: ApproveAttendanceCorrectionDto) {
    const correction = await this.findOne(id);

    if (correction.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể duyệt yêu cầu đang chờ xử lý');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { employee: { select: { fullName: true } } },
    });

    // Cập nhật hoặc tạo mới attendance record
    const checkIn = correction.requestedCheckIn || correction.originalCheckIn;
    const checkOut = correction.requestedCheckOut || correction.originalCheckOut;

    // Tính giờ làm việc
    let workHours: number | null = null;
    if (checkIn && checkOut) {
      const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
      workHours = diff / (1000 * 60 * 60); // Convert to hours
    }

    // Kiểm tra đi muộn (sau 8:45 AM)
    let isLate = false;
    if (checkIn) {
      const checkInTime = new Date(checkIn);
      const lateThreshold = new Date(checkInTime);
      lateThreshold.setHours(8, 45, 0, 0);
      isLate = checkInTime > lateThreshold;
    }

    // Kiểm tra về sớm (trước 5:30 PM)
    let isEarlyLeave = false;
    if (checkOut) {
      const checkOutTime = new Date(checkOut);
      const earlyThreshold = new Date(checkOutTime);
      earlyThreshold.setHours(17, 30, 0, 0);
      isEarlyLeave = checkOutTime < earlyThreshold;
    }

    // Upsert attendance record
    await this.prisma.attendance.upsert({
      where: {
        unique_employee_date: {
          employeeId: correction.employeeId,
          date: correction.date,
        },
      },
      create: {
        employeeId: correction.employeeId,
        date: correction.date,
        checkIn,
        checkOut,
        workHours,
        isLate,
        isEarlyLeave,
        status: 'PRESENT',
        notes: `Điều chỉnh: ${correction.reason}`,
      },
      update: {
        checkIn,
        checkOut,
        workHours,
        isLate,
        isEarlyLeave,
        notes: `Điều chỉnh: ${correction.reason}`,
      },
    });

    // Cập nhật trạng thái correction
    const updated = await this.prisma.attendanceCorrection.update({
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
        attendance: true,
      },
    });

    // Send email notification
    await this.mailService.sendAttendanceCorrectionApproved(correction.employee.email, {
      employeeName: correction.employee.fullName,
      date: correction.date.toLocaleDateString('vi-VN'),
      originalCheckIn: correction.originalCheckIn?.toLocaleTimeString('vi-VN') || 'Chưa có',
      originalCheckOut: correction.originalCheckOut?.toLocaleTimeString('vi-VN') || 'Chưa có',
      requestedCheckIn: correction.requestedCheckIn?.toLocaleTimeString('vi-VN') || 'Không thay đổi',
      requestedCheckOut: correction.requestedCheckOut?.toLocaleTimeString('vi-VN') || 'Không thay đổi',
      approverName: approver?.employee?.fullName || 'HR Manager',
    });

    return updated;
  }

  async reject(id: string, approverId: string, dto: RejectAttendanceCorrectionDto) {
    const correction = await this.findOne(id);

    if (correction.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể từ chối yêu cầu đang chờ xử lý');
    }

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: approverId },
      select: { employee: { select: { fullName: true } } },
    });

    const updated = await this.prisma.attendanceCorrection.update({
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
    await this.mailService.sendAttendanceCorrectionRejected(correction.employee.email, {
      employeeName: correction.employee.fullName,
      date: correction.date.toLocaleDateString('vi-VN'),
      approverName: approver?.employee?.fullName || 'HR Manager',
      reason: dto.rejectedReason,
    });

    return updated;
  }

  async cancel(id: string, employeeId: string) {
    const correction = await this.findOne(id);

    // Chỉ nhân viên tạo yêu cầu mới được hủy
    if (correction.employeeId !== employeeId) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu này');
    }

    if (correction.status !== 'PENDING') {
      throw new BadRequestException('Chỉ có thể hủy yêu cầu đang chờ xử lý');
    }

    return this.prisma.attendanceCorrection.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
