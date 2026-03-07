import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisciplineDto } from './dto/create-discipline.dto';

@Injectable()
export class DisciplinesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDisciplineDto, createdBy: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const discipline = await this.prisma.discipline.create({
      data: {
        employeeId: dto.employeeId,
        reason: dto.reason,
        disciplineType: dto.disciplineType,
        amount: dto.amount,
        disciplineDate: new Date(dto.disciplineDate),
        createdBy,
      },
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true },
        },
      },
    });

    return { success: true, message: 'Discipline created', data: discipline };
  }

  async findAll(query: { employeeId?: string; page?: number; limit?: number }) {
    const { employeeId } = query;
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 500); // Max 500
    const skip = (page - 1) * limit;
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    const [disciplines, total] = await Promise.all([
      this.prisma.discipline.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true } },
          creator: { select: { id: true, email: true } },
        },
        orderBy: { disciplineDate: 'desc' },
      }),
      this.prisma.discipline.count({ where }),
    ]);

    return { success: true, data: disciplines, meta: { total, page, limit } };
  }

  async findByEmployee(employeeId: string) {
    const disciplines = await this.prisma.discipline.findMany({
      where: { employeeId },
      orderBy: { disciplineDate: 'desc' },
    });
    return { success: true, data: disciplines };
  }

  async delete(id: string) {
    const discipline = await this.prisma.discipline.findUnique({ where: { id } });
    if (!discipline) throw new NotFoundException('Discipline not found');

    await this.prisma.discipline.delete({ where: { id } });
    return { success: true, message: 'Discipline deleted' };
  }
}
