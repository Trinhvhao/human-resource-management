import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { EmployeeActivityService, GetActivitiesDto } from './employee-activity.service';

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private activityService: EmployeeActivityService,
  ) { }

  async create(dto: CreateEmployeeDto) {
    // Validate age (minimum 18 years old - Vietnamese labor law)
    const birthDate = new Date(dto.dateOfBirth);
    const age = Math.floor((new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) {
      throw new BadRequestException('Employee must be at least 18 years old (Vietnamese labor law)');
    }
    if (age > 100) {
      throw new BadRequestException('Invalid date of birth');
    }

    // Validate start date (not more than 1 year in the past, not more than 6 months in the future)
    const startDate = new Date(dto.startDate);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

    if (startDate < oneYearAgo) {
      throw new BadRequestException('Start date cannot be more than 1 year in the past');
    }
    if (startDate > sixMonthsLater) {
      throw new BadRequestException('Start date cannot be more than 6 months in the future');
    }

    // Check email uniqueness
    const existingEmail = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check ID card uniqueness
    const existingIdCard = await this.prisma.employee.findUnique({
      where: { idCard: dto.idCard },
    });
    if (existingIdCard) {
      throw new ConflictException('ID card already exists');
    }

    // Validate department
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!department) {
      throw new BadRequestException('Department not found');
    }

    // Generate employee code
    const employeeCode = await this.generateEmployeeCode();

    const employee = await this.prisma.employee.create({
      data: {
        employeeCode,
        fullName: dto.fullName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        idCard: dto.idCard,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        departmentId: dto.departmentId,
        position: dto.position,
        startDate: new Date(dto.startDate),
        baseSalary: dto.baseSalary,
        status: 'ACTIVE',
      },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return {
      success: true,
      message: 'Employee created successfully',
      data: employee,
    };
  }

  async findAll(query: QueryEmployeesDto) {
    const { search, departmentId, position, status, gender, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;
    if (position) where.position = { contains: position, mode: 'insensitive' };
    if (status) where.status = status;
    if (gender) where.gender = gender;

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          phone: true,
          position: true,
          status: true,
          gender: true,
          baseSalary: true,
          startDate: true,
          avatarUrl: true,
          departmentId: true,
          department: {
            select: { id: true, code: true, name: true },
          },
          user: {
            select: { id: true, email: true, role: true, isActive: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      success: true,
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
        contracts: {
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            leaveRequests: true,
            rewards: true,
            disciplines: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return {
      success: true,
      data: employee,
    };
  }

  async update(id: string, dto: UpdateEmployeeDto, userId?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Check email uniqueness if changing
    if (dto.email && dto.email !== employee.email) {
      const existingEmail = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check ID card uniqueness if changing
    if (dto.idCard && dto.idCard !== employee.idCard) {
      const existingIdCard = await this.prisma.employee.findUnique({
        where: { idCard: dto.idCard },
      });
      if (existingIdCard) {
        throw new ConflictException('ID card already exists');
      }
    }

    // Validate department if changing
    if (dto.departmentId && dto.departmentId !== employee.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
        include: {
          parent: true
        }
      });
      if (!department) {
        throw new BadRequestException('Department not found');
      }

      // Business Rule: Cannot move employee to inactive department
      if (!department.isActive) {
        throw new BadRequestException('Cannot assign employee to inactive department');
      }

      // Business Rule: If employee is a manager, check implications
      const managedDepartment = await this.prisma.department.findFirst({
        where: {
          managerId: id,
          isActive: true
        }
      });

      if (managedDepartment) {
        // Business Rule: Manager should belong to the department they manage (or its parent)
        if (managedDepartment.id !== dto.departmentId && managedDepartment.parentId !== dto.departmentId) {
          throw new BadRequestException(
            `This employee manages ${managedDepartment.name}. ` +
            `They must belong to that department or its parent department. ` +
            `Please reassign department manager first.`
          );
        }
      }

      // Business Rule: Employees should belong to main departments, not team departments
      // Teams are logical groupings, actual departmentId should be the parent
      if (department.parentId) {
        const parentName = department.parent ? department.parent.name : 'parent department';
        throw new BadRequestException(
          `Cannot assign employee directly to team "${department.name}". ` +
          `Employees must belong to main departments. ` +
          `Assign to "${parentName}" instead and use position field to indicate team.`
        );
      }
    }

    // Log history for important changes
    const historyFields = ['position', 'departmentId', 'baseSalary', 'status'];
    const historyEntries: any[] = [];

    for (const field of historyFields) {
      if (dto[field] !== undefined && dto[field] !== employee[field]) {
        historyEntries.push({
          employeeId: id,
          field,
          oldValue: String(employee[field]),
          newValue: String(dto[field]),
          changedBy: userId || id,
        });
      }
    }

    // Update employee
    const updateData: any = { ...dto };
    if (dto.dateOfBirth) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    const [updatedEmployee] = await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          department: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      // Create history entries
      ...(historyEntries.length > 0
        ? [this.prisma.employeeHistory.createMany({ data: historyEntries })]
        : []),
    ]);

    return {
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    };
  }

  async delete(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Soft delete - change status to TERMINATED
    await this.prisma.employee.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        endDate: new Date(),
      },
    });

    // Deactivate linked user account if exists
    if (employee.user) {
      await this.prisma.user.update({
        where: { id: employee.user.id },
        data: { isActive: false },
      });
    }

    return {
      success: true,
      message: 'Employee terminated successfully',
    };
  }

  async getHistory(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const history = await this.prisma.employeeHistory.findMany({
      where: { employeeId: id },
      orderBy: { changedAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: history,
    };
  }

  async getStatistics() {
    const [
      total,
      byStatus,
      byDepartment,
      byGender,
      avgSalary,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        _count: { departmentId: true },
      }),
      this.prisma.employee.groupBy({
        by: ['gender'],
        _count: { gender: true },
      }),
      this.prisma.employee.aggregate({
        _avg: { baseSalary: true },
      }),
    ]);

    // Get department names
    const departments = await this.prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });

    const deptMap = new Map(departments.map(d => [d.id, d]));

    return {
      success: true,
      data: {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count.status,
        })),
        byDepartment: byDepartment.map(d => ({
          department: deptMap.get(d.departmentId),
          count: d._count.departmentId,
        })),
        byGender: byGender.map(g => ({
          gender: g.gender,
          count: g._count.gender,
        })),
        averageSalary: avgSalary._avg.baseSalary,
      },
    };
  }

  /**
   * Get employees without active contract
   * Used for contract creation to show only eligible employees
   */
  async getEmployeesWithoutActiveContract(limit: number = 100) {
    // Get all active employees
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        phone: true,
        position: true,
        avatarUrl: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
          },
        },
      },
      take: Math.min(limit, 100), // Max 100
      orderBy: {
        fullName: 'asc',
      },
    });

    // Filter out employees with active contracts
    const employeesWithoutContract = employees.filter(
      emp => emp.contracts.length === 0
    );

    // Remove contracts field from response
    const cleanedEmployees = employeesWithoutContract.map(emp => {
      const { contracts, ...rest } = emp;
      return rest;
    });

    return {
      success: true,
      data: cleanedEmployees,
      meta: {
        total: cleanedEmployees.length,
        totalActive: employees.length,
        withContract: employees.length - cleanedEmployees.length,
      },
    };
  }

  // Public method to generate next employee code
  async generateNextEmployeeCode(): Promise<string> {
    return this.generateEmployeeCode();
  }

  private async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);

    // Find the latest employee code for this year
    const latestEmployee = await this.prisma.employee.findFirst({
      where: {
        employeeCode: { startsWith: `EMP${year}` },
      },
      orderBy: { employeeCode: 'desc' },
    });

    let nextNumber = 1;
    if (latestEmployee) {
      const currentNumber = parseInt(latestEmployee.employeeCode.slice(-3));
      nextNumber = currentNumber + 1;
    }

    return `EMP${year}${nextNumber.toString().padStart(3, '0')}`;
  }

  async getTopPerformers(limit: number = 5, period: 'week' | 'month' = 'month') {
    const now = new Date();
    const startDate = period === 'week'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Get active employees with their attendance and rewards
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        position: true,
        department: {
          select: { name: true },
        },
        attendances: {
          where: {
            date: { gte: startDate },
          },
          select: {
            status: true,
            isLate: true,
            workHours: true,
          },
        },
        rewards: {
          where: {
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
          },
        },
      },
      take: 50, // Limit to top 50 for performance
    });

    // Calculate performance score for each employee
    const performersWithScores = employees.map(emp => {
      const totalAttendance = emp.attendances.length;
      const presentDays = emp.attendances.filter(a => a.status === 'PRESENT').length;
      const lateDays = emp.attendances.filter(a => a.isLate).length;
      const totalWorkHours = emp.attendances.reduce((sum, a) => sum + (Number(a.workHours) || 0), 0);
      const rewardsCount = emp.rewards.length;

      // Calculate metrics (0-100 scale)
      const attendanceRate = totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;
      const onTimeRate = totalAttendance > 0 ? ((totalAttendance - lateDays) / totalAttendance) * 100 : 0;
      const avgWorkHours = totalAttendance > 0 ? totalWorkHours / totalAttendance : 0;

      // Work hours score (8 hours = 100%, max 10 hours = 125%)
      const workHoursScore = Math.min((avgWorkHours / 8) * 100, 125);

      // Rewards bonus (each reward = 5 points, max 20 points)
      const rewardsBonus = Math.min(rewardsCount * 5, 20);

      // Calculate weighted performance score
      // Attendance: 40%, On-time: 30%, Work hours: 20%, Rewards: 10%
      const baseScore = (
        attendanceRate * 0.4 +
        onTimeRate * 0.3 +
        workHoursScore * 0.2
      );

      const finalScore = Math.min(baseScore + rewardsBonus, 100);

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: emp.fullName,
        position: emp.position,
        department: emp.department?.name || 'N/A',
        score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
        metrics: {
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          onTimeRate: Math.round(onTimeRate * 10) / 10,
          avgWorkHours: Math.round(avgWorkHours * 10) / 10,
          rewardsCount,
        },
        achievements: rewardsCount,
      };
    });

    // Sort by score and take top N
    const topPerformers = performersWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      success: true,
      data: topPerformers,
      meta: {
        period,
        startDate,
        endDate: now,
        totalEvaluated: employees.length,
      },
    };
  }

  // =====================================================
  // EMPLOYEE PROFILE METHODS
  // =====================================================

  /**
   * Get employee profile with extended information
   */
  async getEmployeeProfile(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        profile: true,
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Calculate profile completion in real-time
    const profileCompletionPercentage = await this.calculateProfileCompletion(id);

    // Convert BigInt to Number for JSON serialization
    const documentsWithNumberSize = employee.documents.map(doc => ({
      ...doc,
      fileSize: Number(doc.fileSize),
    }));

    return {
      success: true,
      data: {
        ...employee,
        documents: documentsWithNumberSize,
        profile: employee.profile ? {
          ...employee.profile,
          profileCompletionPercentage, // Override with real-time calculation
        } : null,
      },
    };
  }

  /**
   * Update employee profile
   */
  async updateEmployeeProfile(id: string, dto: any) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Update or create profile
    const profile = await this.prisma.employeeProfile.upsert({
      where: { employeeId: id },
      create: {
        employeeId: id,
        ...dto,
      },
      update: {
        ...dto,
        lastProfileUpdate: new Date(),
      },
    });

    // Calculate and update completion percentage
    await this.updateProfileCompletion(id);

    // Log activity
    await this.activityService.logActivity({
      employeeId: id,
      activityType: 'profile_update',
      action: 'updated',
      description: 'Cập nhật thông tin hồ sơ chi tiết',
      newValue: dto,
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    };
  }

  /**
   * Calculate profile completion percentage (real-time, not stored in DB)
   */
  private async calculateProfileCompletion(employeeId: string): Promise<number> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        phone: true,
        address: true,
        gender: true,
        email: true,
        dateOfBirth: true,
        idCard: true,
      },
    });

    const profile = await this.prisma.employeeProfile.findUnique({
      where: { employeeId },
    });

    if (!employee) return 0;

    let completion = 0;

    // Basic Employee Info (30%) - Most important
    if (employee.phone) completion += 5;
    if (employee.address) completion += 5;
    if (employee.gender) completion += 5;
    if (employee.email) completion += 5; // Always has email
    if (employee.dateOfBirth) completion += 5; // Always has DOB
    if (employee.idCard) completion += 5; // Always has ID card

    if (profile) {
      // Personal Info (15%)
      if (profile.placeOfBirth) completion += 5;
      if (profile.nationality) completion += 5;
      if (profile.maritalStatus) completion += 5;

      // Emergency Contact (15%)
      if (profile.emergencyContactName) completion += 5;
      if (profile.emergencyContactPhone) completion += 5;
      if (profile.emergencyContactRelationship) completion += 5;

      // Education (15%)
      if (profile.highestEducation) completion += 5;
      if (profile.major) completion += 5;
      if (profile.university) completion += 5;

      // Bank Info (15%)
      if (profile.bankName) completion += 5;
      if (profile.bankAccountNumber) completion += 5;
      if (profile.bankBranch) completion += 5;
    }

    // Documents (10%)
    const documents = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        documentType: { in: ['RESUME', 'ID_CARD_FRONT'] },
      },
    });
    if (documents.length >= 2) {
      completion += 10;
    }

    return Math.round(completion);
  }

  /**
   * Calculate profile completion percentage (DEPRECATED - kept for backward compatibility)
   * Now we calculate on-the-fly instead of storing in DB
   */
  private async updateProfileCompletion(employeeId: string) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { employeeId },
    });

    if (!profile) return;

    // Get employee basic info
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        phone: true,
        address: true,
        gender: true,
        email: true,
        dateOfBirth: true,
        idCard: true,
      },
    });

    if (!employee) return;

    let completion = 0;

    // Basic Employee Info (30%) - Most important
    let basicInfoScore = 0;
    if (employee.phone) basicInfoScore += 5;
    if (employee.address) basicInfoScore += 5;
    if (employee.gender) basicInfoScore += 5;
    if (employee.email) basicInfoScore += 5; // Always has email
    if (employee.dateOfBirth) basicInfoScore += 5; // Always has DOB
    if (employee.idCard) basicInfoScore += 5; // Always has ID card
    completion += basicInfoScore;

    // Personal Info (15%)
    let personalScore = 0;
    if (profile.placeOfBirth) personalScore += 5;
    if (profile.nationality) personalScore += 5;
    if (profile.maritalStatus) personalScore += 5;
    completion += personalScore;

    // Emergency Contact (15%)
    let emergencyScore = 0;
    if (profile.emergencyContactName) emergencyScore += 5;
    if (profile.emergencyContactPhone) emergencyScore += 5;
    if (profile.emergencyContactRelationship) emergencyScore += 5;
    completion += emergencyScore;

    // Education (15%)
    let educationScore = 0;
    if (profile.highestEducation) educationScore += 5;
    if (profile.major) educationScore += 5;
    if (profile.university) educationScore += 5;
    completion += educationScore;

    // Bank Info (15%)
    let bankScore = 0;
    if (profile.bankName) bankScore += 5;
    if (profile.bankAccountNumber) bankScore += 5;
    if (profile.bankBranch) bankScore += 5;
    completion += bankScore;

    // Documents (10%)
    const documents = await this.prisma.employeeDocument.findMany({
      where: {
        employeeId,
        documentType: { in: ['RESUME', 'ID_CARD_FRONT'] },
      },
    });
    if (documents.length >= 2) {
      completion += 10;
    }

    // Update profile and employee
    await this.prisma.employeeProfile.update({
      where: { employeeId },
      data: {
        profileCompletionPercentage: completion,
        lastProfileUpdate: new Date(),
      },
    });

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        hasCompleteProfile: completion >= 80,
        profileLastUpdated: new Date(),
      },
    });
  }

  /**
   * Upload employee document
   */
  async uploadDocument(
    employeeId: string,
    file: Express.Multer.File,
    documentType: string,
    description?: string,
    uploadedBy?: string,
  ) {
    // Check if employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // For avatar, delete old avatar first
    if (documentType === 'AVATAR') {
      const oldAvatar = await this.prisma.employeeDocument.findFirst({
        where: {
          employeeId,
          documentType: 'AVATAR',
        },
      });

      if (oldAvatar) {
        await this.prisma.employeeDocument.delete({
          where: { id: oldAvatar.id },
        });
      }

      // Update employee avatarUrl
      const avatarUrl = `/uploads/avatars/${file.filename}`;
      await this.prisma.employee.update({
        where: { id: employeeId },
        data: { avatarUrl },
      });

      // Create document record
      const document = await this.prisma.employeeDocument.create({
        data: {
          employeeId,
          documentType,
          fileName: file.originalname,
          fileUrl: avatarUrl,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          description,
          uploadedBy,
        },
      });

      // Update profile completion
      await this.updateProfileCompletion(employeeId);

      // Log activity
      await this.activityService.logActivity({
        employeeId,
        activityType: 'profile_update',
        action: 'updated',
        description: 'Cập nhật ảnh đại diện',
        metadata: { documentType: 'AVATAR' },
        performedBy: uploadedBy,
      });

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          ...document,
          fileSize: Number(document.fileSize),
          avatarUrl, // Return avatarUrl for frontend
        },
      };
    }

    // Create document record
    const document = await this.prisma.employeeDocument.create({
      data: {
        employeeId,
        documentType,
        fileName: file.originalname,
        fileUrl: `/uploads/${documentType.toLowerCase()}/${file.filename}`,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        description,
        uploadedBy,
      },
    });

    // Update profile completion
    await this.updateProfileCompletion(employeeId);

    // Log activity
    await this.activityService.logActivity({
      employeeId,
      activityType: 'document_upload',
      action: 'created',
      description: `Tải lên tài liệu: ${file.originalname}`,
      metadata: { documentType, fileName: file.originalname },
      performedBy: uploadedBy,
    });

    return {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        ...document,
        fileSize: Number(document.fileSize), // Convert BigInt to Number for JSON
      },
    };
  }

  /**
   * Get employee documents
   */
  async getEmployeeDocuments(employeeId: string, documentType?: string) {
    const where: any = { employeeId };
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await this.prisma.employeeDocument.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: documents.map(doc => ({
        ...doc,
        fileSize: Number(doc.fileSize), // Convert BigInt to Number
      })),
    };
  }

  /**
   * Delete employee document
   */
  async deleteDocument(employeeId: string, documentId: string) {
    const document = await this.prisma.employeeDocument.findFirst({
      where: {
        id: documentId,
        employeeId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.employeeDocument.delete({
      where: { id: documentId },
    });

    // Update profile completion
    await this.updateProfileCompletion(employeeId);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  /**
   * Get profile completion stats
   */
  async getProfileCompletionStats() {
    const stats = await this.prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE has_complete_profile = true) as complete,
        COUNT(*) FILTER (WHERE has_complete_profile = false) as incomplete,
        AVG(COALESCE(ep.profile_completion_percentage, 0))::INT as avg_completion
      FROM employees e
      LEFT JOIN employee_profiles ep ON e.id = ep.employee_id
      WHERE e.status = 'ACTIVE'
    `;

    return {
      success: true,
      data: {
        total: Number(stats[0].total),
        complete: Number(stats[0].complete),
        incomplete: Number(stats[0].incomplete),
        avgCompletion: Number(stats[0].avg_completion),
      },
    };
  }

  // =====================================================
  // EMPLOYEE ACTIVITY METHODS
  // =====================================================

  /**
   * Get employee activities
   */
  async getEmployeeActivities(dto: GetActivitiesDto) {
    return this.activityService.getActivities(dto);
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(employeeId: string) {
    return this.activityService.getActivityStats(employeeId);
  }

  /**
   * Recalculate profile completion for all employees
   * Useful after updating the calculation logic
   */
  async recalculateAllProfileCompletions() {
    const employees = await this.prisma.employee.findMany({
      select: { id: true },
    });

    let updated = 0;
    for (const employee of employees) {
      try {
        await this.updateProfileCompletion(employee.id);
        updated++;
      } catch (error) {
        console.error(`Failed to update profile completion for employee ${employee.id}:`, error);
      }
    }

    return {
      success: true,
      message: `Recalculated profile completion for ${updated} employees`,
      data: {
        total: employees.length,
        updated,
      },
    };
  }
}
