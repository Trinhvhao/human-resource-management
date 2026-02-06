import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateChangeRequestDto, ChangeRequestType } from './dto/create-change-request.dto';
import { ReviewChangeRequestDto, ReviewAction } from './dto/review-change-request.dto';

@Injectable()
export class DepartmentChangeRequestsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(departmentId: string, userId: string, dto: CreateChangeRequestDto) {
    // Validate department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        manager: true,
        parent: true,
        _count: { select: { employees: true } }
      }
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Validate effective date (minimum 7 days from now)
    const effectiveDate = new Date(dto.effectiveDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 7);
    
    if (effectiveDate < minDate) {
      throw new BadRequestException('Effective date must be at least 7 days from now');
    }

    // Validate based on request type
    if (dto.requestType === ChangeRequestType.CHANGE_MANAGER) {
      if (!dto.newManagerId) {
        throw new BadRequestException('New manager ID is required for CHANGE_MANAGER request');
      }

      // Check manager eligibility
      const eligibility = await this.checkManagerEligibility(dto.newManagerId, departmentId);
      if (!eligibility.eligible) {
        throw new BadRequestException(`Manager not eligible: ${eligibility.reasons.join(', ')}`);
      }
    }

    if (dto.requestType === ChangeRequestType.CHANGE_PARENT) {
      if (!dto.newParentId) {
        throw new BadRequestException('New parent ID is required for CHANGE_PARENT request');
      }

      // Validate parent
      const newParent = await this.prisma.department.findUnique({
        where: { id: dto.newParentId }
      });

      if (!newParent) {
        throw new BadRequestException('New parent department not found');
      }

      if (newParent.parentId) {
        throw new BadRequestException('Cannot set parent to a child department (max 2 levels)');
      }
    }

    // Check for pending requests
    const pendingRequest = await this.prisma.departmentChangeRequest.findFirst({
      where: {
        departmentId,
        status: 'PENDING'
      }
    });

    if (pendingRequest) {
      throw new BadRequestException('There is already a pending change request for this department');
    }

    // Prepare newData based on request type
    let newData: any = undefined;
    if (dto.requestType === ChangeRequestType.CHANGE_MANAGER) {
      newData = { managerId: dto.newManagerId };
    } else if (dto.requestType === ChangeRequestType.CHANGE_PARENT) {
      newData = { parentId: dto.newParentId };
    }

    // Create change request
    const changeRequest = await this.prisma.departmentChangeRequest.create({
      data: {
        departmentId,
        requestType: dto.requestType,
        requestedBy: userId,
        oldManagerId: department.managerId,
        oldParentId: department.parentId,
        oldData: {
          code: department.code,
          name: department.name,
          description: department.description,
        },
        newManagerId: dto.newManagerId,
        newParentId: dto.newParentId,
        newData,
        reason: dto.reason,
        effectiveDate,
      },
      include: {
        department: true,
        requester: {
          include: { employee: true }
        },
        oldManager: true,
        newManager: true,
      }
    });

    // Send notification to HR/Admin
    await this.notifyApprovers(changeRequest);

    return {
      success: true,
      message: 'Change request created successfully',
      data: changeRequest,
    };
  }

  async findAll(filters?: { status?: string; departmentId?: string }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const requests = await this.prisma.departmentChangeRequest.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        requester: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                fullName: true,
                employeeCode: true,
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: requests,
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.departmentChangeRequest.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            _count: { select: { employees: true } }
          }
        },
        requester: {
          include: { employee: true }
        },
        reviewer: {
          include: { employee: true }
        },
        oldManager: true,
        newManager: true,
        oldParent: true,
        newParent: true,
      }
    });

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    // Get impact analysis
    const impact = await this.analyzeImpact(request.departmentId, request);

    return {
      success: true,
      data: {
        ...request,
        impact,
      },
    };
  }

  async review(id: string, userId: string, dto: ReviewChangeRequestDto) {
    const request = await this.prisma.departmentChangeRequest.findUnique({
      where: { id },
      include: {
        department: true,
        requester: { include: { employee: true } },
        oldManager: true,
        newManager: true,
      }
    });

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Change request has already been reviewed');
    }

    const newStatus = dto.action === ReviewAction.APPROVE ? 'APPROVED' : 'REJECTED';

    // Update request
    const updated = await this.prisma.departmentChangeRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote,
      },
      include: {
        department: true,
        requester: { include: { employee: true } },
        reviewer: { include: { employee: true } },
        oldManager: true,
        newManager: true,
      }
    });

    // If approved, create transition and apply changes
    if (dto.action === ReviewAction.APPROVE) {
      await this.applyApprovedChange(updated, userId);
    }

    // Send notifications
    await this.notifyReviewDecision(updated);

    return {
      success: true,
      message: `Change request ${newStatus.toLowerCase()} successfully`,
      data: updated,
    };
  }

  private async applyApprovedChange(request: any, userId: string) {
    if (request.requestType === ChangeRequestType.CHANGE_MANAGER) {
      // Create manager transition
      const targetEndDate = new Date(request.effectiveDate);
      targetEndDate.setDate(targetEndDate.getDate() + 14); // 14 days for transition

      await this.prisma.managerTransition.create({
        data: {
          departmentId: request.departmentId,
          changeRequestId: request.id,
          oldManagerId: request.oldManagerId,
          newManagerId: request.newManagerId,
          status: 'INITIATED',
          targetEndDate,
          handoverTasks: this.getDefaultHandoverTasks(),
        }
      });

      // Update department manager on effective date
      if (new Date() >= new Date(request.effectiveDate)) {
        await this.prisma.department.update({
          where: { id: request.departmentId },
          data: { managerId: request.newManagerId }
        });

        // Log history
        await this.logHistory({
          departmentId: request.departmentId,
          changeType: 'MANAGER_CHANGED',
          changedBy: userId,
          oldValue: { managerId: request.oldManagerId },
          newValue: { managerId: request.newManagerId },
          changeReason: request.reason,
        });

        // Update user role if needed
        if (request.newManager?.user && request.newManager.user.role === 'EMPLOYEE') {
          await this.prisma.user.update({
            where: { id: request.newManager.user.id },
            data: { role: 'MANAGER' }
          });
        }
      }
    }

    if (request.requestType === ChangeRequestType.CHANGE_PARENT) {
      await this.prisma.department.update({
        where: { id: request.departmentId },
        data: { parentId: request.newParentId }
      });

      await this.logHistory({
        departmentId: request.departmentId,
        changeType: 'PARENT_CHANGED',
        changedBy: userId,
        oldValue: { parentId: request.oldParentId },
        newValue: { parentId: request.newParentId },
        changeReason: request.reason,
      });
    }
  }

  private async checkManagerEligibility(employeeId: string, departmentId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: true,
        managedDepartments: true,
      }
    });

    if (!employee) {
      return { eligible: false, reasons: ['Employee not found'] };
    }

    const reasons: string[] = [];

    // Check 1: Must be ACTIVE
    if (employee.status !== 'ACTIVE') {
      reasons.push('Employee must be ACTIVE');
    }

    // Check 2: Must not be managing another department
    const activeDept = employee.managedDepartments.find(d => d.isActive && d.id !== departmentId);
    if (activeDept) {
      reasons.push(`Already managing ${activeDept.name}`);
    }

    // Check 3: Minimum tenure (6 months)
    const tenureMonths = Math.floor((Date.now() - employee.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    if (tenureMonths < 6) {
      reasons.push(`Minimum tenure is 6 months (current: ${tenureMonths} months)`);
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  private async analyzeImpact(departmentId: string, request: any) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            employees: true,
            children: true,
          }
        }
      }
    });

    // Count pending approvals
    const [pendingLeaves, pendingOvertime] = await Promise.all([
      this.prisma.leaveRequest.count({
        where: {
          employee: { departmentId },
          status: 'PENDING'
        }
      }),
      this.prisma.overtimeRequest.count({
        where: {
          employee: { departmentId },
          status: 'PENDING'
        }
      }),
    ]);

    return {
      affectedEmployees: department?._count.employees || 0,
      affectedTeams: department?._count.children || 0,
      pendingApprovals: {
        leaves: pendingLeaves,
        overtime: pendingOvertime,
      },
      estimatedTransitionDays: 14,
    };
  }

  private getDefaultHandoverTasks() {
    return [
      { id: 1, title: 'Bàn giao tài liệu quản lý', completed: false },
      { id: 2, title: 'Giới thiệu team members', completed: false },
      { id: 3, title: 'Chuyển giao dự án đang chạy', completed: false },
      { id: 4, title: 'Cập nhật quyền truy cập hệ thống', completed: false },
      { id: 5, title: 'Họp bàn giao với HR', completed: false },
    ];
  }

  private async logHistory(data: {
    departmentId: string;
    changeType: string;
    changedBy: string;
    oldValue: any;
    newValue: any;
    changeReason: string;
  }) {
    await this.prisma.departmentHistory.create({
      data
    });
  }

  private async notifyApprovers(request: any) {
    // Get HR_MANAGER and ADMIN users
    const approvers = await this.prisma.user.findMany({
      where: {
        role: { in: ['HR_MANAGER', 'ADMIN'] },
        isActive: true,
      },
      include: { employee: true }
    });

    // Send email to each approver
    for (const approver of approvers) {
      if (approver.email) {
        // TODO: Implement email sending
        console.log(`Sending notification to ${approver.email} about change request ${request.id}`);
      }
    }
  }

  private async notifyReviewDecision(request: any) {
    // Notify requester
    if (request.requester?.email) {
      console.log(`Notifying requester ${request.requester.email} about decision: ${request.status}`);
    }

    // If approved, notify old and new managers
    if (request.status === 'APPROVED') {
      if (request.oldManager?.email) {
        console.log(`Notifying old manager ${request.oldManager.email}`);
      }
      if (request.newManager?.email) {
        console.log(`Notifying new manager ${request.newManager.email}`);
      }
    }
  }
}
