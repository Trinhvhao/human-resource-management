import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRewardDto, createdBy: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const reward = await this.prisma.reward.create({
      data: {
        employeeId: dto.employeeId,
        reason: dto.reason,
        amount: dto.amount,
        rewardDate: new Date(dto.rewardDate),
        rewardType: dto.rewardType,
        createdBy,
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true },
        },
      },
    });

    return { success: true, message: 'Reward created', data: reward };
  }

  async findAll(query: { employeeId?: string; page?: number; limit?: number }) {
    const { employeeId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [rewards, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true } },
          creator: { select: { id: true, email: true } },
        },
        orderBy: { rewardDate: 'desc' },
      }),
      this.prisma.reward.count({ where }),
    ]);

    return { success: true, data: rewards, meta: { total, page, limit } };
  }

  async findByEmployee(employeeId: string) {
    const rewards = await this.prisma.reward.findMany({
      where: { employeeId },
      orderBy: { rewardDate: 'desc' },
    });
    return { success: true, data: rewards };
  }

  async delete(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');

    await this.prisma.reward.delete({ where: { id } });
    return { success: true, message: 'Reward deleted' };
  }
}
