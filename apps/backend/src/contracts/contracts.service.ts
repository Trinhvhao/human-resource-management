import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto, RenewContractDto, TerminateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    // Validate employee
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // Check for active contract
    const activeContract = await this.prisma.contract.findFirst({
      where: {
        employeeId: dto.employeeId,
        status: 'ACTIVE',
      },
    });
    if (activeContract) {
      throw new ConflictException('Employee already has an active contract');
    }

    // Generate contract number if not provided
    const contractNumber = dto.contractNumber || await this.generateContractNumber();

    const contract = await this.prisma.contract.create({
      data: {
        employeeId: dto.employeeId,
        contractType: dto.contractType,
        contractNumber,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        salary: dto.salary,
        terms: dto.terms,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true },
        },
      },
    });

    // Update employee base salary
    await this.prisma.employee.update({
      where: { id: dto.employeeId },
      data: { baseSalary: dto.salary },
    });

    return {
      success: true,
      message: 'Contract created successfully',
      data: contract,
    };
  }

  async findAll(query: { employeeId?: string; status?: string; page?: number; limit?: number }) {
    const { employeeId, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: { id: true, employeeCode: true, fullName: true, department: { select: { name: true } } },
          },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      success: true,
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true, employeeCode: true, fullName: true, email: true, phone: true,
            department: { select: { id: true, code: true, name: true } },
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return { success: true, data: contract };
  }

  async findByEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const contracts = await this.prisma.contract.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });

    return { success: true, data: contracts };
  }

  async update(id: string, dto: UpdateContractDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const updateData: any = { ...dto };
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    const updated = await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true },
        },
      },
    });

    // Update employee salary if changed
    if (dto.salary) {
      await this.prisma.employee.update({
        where: { id: contract.employeeId },
        data: { baseSalary: dto.salary },
      });
    }

    return {
      success: true,
      message: 'Contract updated successfully',
      data: updated,
    };
  }

  async renew(id: string, dto: RenewContractDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Terminate old contract
    await this.prisma.contract.update({
      where: { id },
      data: { status: 'EXPIRED' },
    });

    // Create new contract
    const newContractNumber = await this.generateContractNumber();
    const newContract = await this.prisma.contract.create({
      data: {
        employeeId: contract.employeeId,
        contractType: dto.newContractType || contract.contractType,
        contractNumber: newContractNumber,
        startDate: contract.endDate || new Date(),
        endDate: new Date(dto.newEndDate),
        salary: dto.newSalary || contract.salary,
        status: 'ACTIVE',
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true },
        },
      },
    });

    // Update employee salary
    if (dto.newSalary) {
      await this.prisma.employee.update({
        where: { id: contract.employeeId },
        data: { baseSalary: dto.newSalary },
      });
    }

    return {
      success: true,
      message: 'Contract renewed successfully',
      data: newContract,
    };
  }

  async terminate(id: string, dto: TerminateContractDto) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const terminated = await this.prisma.contract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminatedReason: dto.reason,
        endDate: new Date(),
      },
    });

    return {
      success: true,
      message: 'Contract terminated successfully',
      data: terminated,
    };
  }

  async getExpiringContracts(days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const contracts = await this.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: futureDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true, employeeCode: true, fullName: true, email: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { endDate: 'asc' },
    });

    return {
      success: true,
      data: contracts,
      meta: { total: contracts.length, days },
    };
  }

  // Cron job: Auto-expire contracts daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'auto-expire-contracts',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async autoExpireContracts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredContracts = await this.prisma.contract.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          not: null,
          lt: today,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredContracts.count > 0) {
      console.log(`[Cron] Auto-expired ${expiredContracts.count} contracts`);
    }

    return {
      success: true,
      message: `Auto-expired ${expiredContracts.count} contracts`,
      count: expiredContracts.count,
    };
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.contract.count({
      where: {
        contractNumber: { startsWith: `HD-${year}` },
      },
    });
    return `HD-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }
}
