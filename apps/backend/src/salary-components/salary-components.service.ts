import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';

@Injectable()
export class SalaryComponentsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateSalaryComponentDto) {
    // Validate employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: String(createDto.employeeId) },
    });

    if (!employee) {
      throw new NotFoundException(`Nhân viên với ID ${createDto.employeeId} không tồn tại`);
    }

    // Check if BASIC salary component already exists for this employee
    if (createDto.componentType === 'BASIC') {
      const existing = await this.prisma.salaryComponent.findFirst({
        where: {
          employeeId: String(createDto.employeeId),
          componentType: 'BASIC',
          isActive: true,
        },
      });

      if (existing) {
        throw new BadRequestException('Nhân viên đã có lương cơ bản. Vui lòng cập nhật thay vì tạo mới.');
      }
    }

    const component = await this.prisma.salaryComponent.create({
      data: {
        employeeId: String(createDto.employeeId),
        componentType: createDto.componentType,
        amount: createDto.amount,
        effectiveDate: createDto.effectiveDate ? new Date(createDto.effectiveDate) : new Date(),
        note: createDto.note,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Tạo thành phần lương thành công',
      data: component,
    };
  }

  async findAll(employeeId?: string, componentType?: string, isActive?: boolean) {
    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (componentType) where.componentType = componentType;
    if (isActive !== undefined) where.isActive = isActive;

    const components = await this.prisma.salaryComponent.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [
        { employeeId: 'asc' },
        { effectiveDate: 'desc' },
      ],
    });

    return {
      success: true,
      data: components,
      meta: {
        total: components.length,
      },
    };
  }

  async findOne(id: string) {
    const component = await this.prisma.salaryComponent.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!component) {
      throw new NotFoundException(`Thành phần lương với ID ${id} không tồn tại`);
    }

    return {
      success: true,
      data: component,
    };
  }

  async findByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Nhân viên với ID ${employeeId} không tồn tại`);
    }

    const components = await this.prisma.salaryComponent.findMany({
      where: {
        employeeId,
        isActive: true,
      },
      orderBy: { componentType: 'asc' },
    });

    // Calculate total salary
    const totalSalary = components.reduce((sum, comp) => sum + Number(comp.amount), 0);

    return {
      success: true,
      data: {
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
        },
        components,
        totalSalary,
      },
    };
  }

  async update(id: string, updateDto: UpdateSalaryComponentDto) {
    const existing = await this.prisma.salaryComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Thành phần lương với ID ${id} không tồn tại`);
    }

    const component = await this.prisma.salaryComponent.update({
      where: { id },
      data: {
        ...updateDto,
        effectiveDate: updateDto.effectiveDate ? new Date(updateDto.effectiveDate) : undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Cập nhật thành phần lương thành công',
      data: component,
    };
  }

  async deactivate(id: string) {
    const existing = await this.prisma.salaryComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Thành phần lương với ID ${id} không tồn tại`);
    }

    const component = await this.prisma.salaryComponent.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Vô hiệu hóa thành phần lương thành công',
      data: component,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.salaryComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Thành phần lương với ID ${id} không tồn tại`);
    }

    await this.prisma.salaryComponent.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Xóa thành phần lương thành công',
    };
  }

  // Helper method for payroll calculation
  async getActiveComponentsByEmployee(employeeId: string) {
    return this.prisma.salaryComponent.findMany({
      where: {
        employeeId,
        isActive: true,
      },
    });
  }

  // Calculate total salary for an employee
  async calculateTotalSalary(employeeId: string): Promise<number> {
    const components = await this.getActiveComponentsByEmployee(employeeId);
    return components.reduce((sum, comp) => sum + Number(comp.amount), 0);
  }
}
