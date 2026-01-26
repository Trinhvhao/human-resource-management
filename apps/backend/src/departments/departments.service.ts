import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    // Check if code exists
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Department code already exists');
    }

    // Validate parent department
    if (dto.parentId) {
      const parent = await this.prisma.department.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent department not found');
      }
    }

    // Validate manager
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    const department = await this.prisma.department.create({
      data: dto,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Department created successfully',
      data: department,
    };
  }

  async findAll() {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
        _count: {
          select: {
            employees: true,
            children: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return {
      success: true,
      data: departments,
    };
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
            email: true,
            phone: true,
          },
        },
        employees: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
            email: true,
          },
          take: 10,
        },
        _count: {
          select: {
            employees: true,
            children: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return {
      success: true,
      data: department,
    };
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check code uniqueness if changing
    if (dto.code && dto.code !== department.code) {
      const existing = await this.prisma.department.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException('Department code already exists');
      }
    }

    // Validate parent department
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Department cannot be its own parent');
      }

      const parent = await this.prisma.department.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new BadRequestException('Parent department not found');
      }
    }

    // Validate manager
    if (dto.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: dto.managerId },
      });

      if (!manager) {
        throw new BadRequestException('Manager not found');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: dto,
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Department updated successfully',
      data: updated,
    };
  }

  async delete(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            children: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department._count.employees > 0) {
      throw new BadRequestException('Cannot delete department with employees');
    }

    if (department._count.children > 0) {
      throw new BadRequestException('Cannot delete department with sub-departments');
    }

    // Soft delete
    await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Department deleted successfully',
    };
  }

  async getOrganizationTree() {
    // Get all active departments
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      return departments
        .filter(dept => dept.parentId === parentId)
        .map(dept => ({
          ...dept,
          children: buildTree(dept.id),
        }));
    };

    const tree = buildTree(null);

    return {
      success: true,
      data: tree,
    };
  }

  async assignManager(departmentId: string, managerId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const manager = await this.prisma.employee.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    const updated = await this.prisma.department.update({
      where: { id: departmentId },
      data: { managerId },
      include: {
        manager: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Manager assigned successfully',
      data: updated,
    };
  }
}
