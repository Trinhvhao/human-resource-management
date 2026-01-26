import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

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
    const { search, departmentId, position, status, gender, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
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
        include: {
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
      });
      if (!department) {
        throw new BadRequestException('Department not found');
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
}
