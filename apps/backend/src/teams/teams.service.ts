import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    // Check if code exists
    const existing = await this.prisma.team.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Team code already exists');
    }

    // Validate department
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new BadRequestException('Department not found');
    }

    if (!department.isActive) {
      throw new BadRequestException('Cannot create team for inactive department');
    }

    // Validate team lead
    if (dto.teamLeadId) {
      const teamLead = await this.prisma.employee.findUnique({
        where: { id: dto.teamLeadId },
      });

      if (!teamLead) {
        throw new BadRequestException('Team lead not found');
      }

      if (teamLead.departmentId !== dto.departmentId) {
        throw new BadRequestException('Team lead must belong to the same department');
      }

      if (teamLead.status !== 'ACTIVE') {
        throw new BadRequestException('Team lead must be an active employee');
      }
    }

    const team = await this.prisma.team.create({
      data: dto,
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        teamLead: {
          select: { id: true, employeeCode: true, fullName: true, position: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return {
      success: true,
      message: 'Team created successfully',
      data: team,
    };
  }

  async findAll(departmentId?: string) {
    const where: any = { isActive: true };
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        teamLead: {
          select: { id: true, employeeCode: true, fullName: true, position: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: teams,
    };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        teamLead: {
          select: { id: true, employeeCode: true, fullName: true, position: true, email: true },
        },
        members: {
          where: { isActive: true },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
                position: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { role: 'asc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return {
      success: true,
      data: team,
    };
  }

  async update(id: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check code uniqueness if changing
    if (dto.code && dto.code !== team.code) {
      const existing = await this.prisma.team.findUnique({
        where: { code: dto.code },
      });

      if (existing) {
        throw new ConflictException('Team code already exists');
      }
    }

    // Validate department if changing
    if (dto.departmentId && dto.departmentId !== team.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });

      if (!department || !department.isActive) {
        throw new BadRequestException('Invalid department');
      }
    }

    // Validate team lead if changing
    if (dto.teamLeadId) {
      const teamLead = await this.prisma.employee.findUnique({
        where: { id: dto.teamLeadId },
      });

      if (!teamLead) {
        throw new BadRequestException('Team lead not found');
      }

      const targetDeptId = dto.departmentId || team.departmentId;
      if (teamLead.departmentId !== targetDeptId) {
        throw new BadRequestException('Team lead must belong to the team department');
      }
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: dto,
      include: {
        department: {
          select: { id: true, code: true, name: true },
        },
        teamLead: {
          select: { id: true, employeeCode: true, fullName: true, position: true },
        },
      },
    });

    return {
      success: true,
      message: 'Team updated successfully',
      data: updated,
    };
  }

  async delete(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team._count.members > 0) {
      throw new BadRequestException('Cannot delete team with members. Remove all members first.');
    }

    // Soft delete
    await this.prisma.team.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Team deleted successfully',
    };
  }

  // Team Member Management
  async addMember(teamId: string, dto: AddTeamMemberDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team || !team.isActive) {
      throw new NotFoundException('Team not found or inactive');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status !== 'ACTIVE') {
      throw new BadRequestException('Employee must be active');
    }

    if (employee.departmentId !== team.departmentId) {
      throw new BadRequestException('Employee must belong to the same department as the team');
    }

    // Check if already a member
    const existing = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        employeeId: dto.employeeId,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException('Employee is already a member of this team');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        employeeId: dto.employeeId,
        role: dto.role || 'MEMBER',
        allocationPercentage: dto.allocationPercentage || 100,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: true,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            position: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Team member added successfully',
      data: member,
    };
  }

  async removeMember(teamId: string, memberId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Team member not found');
    }

    // Soft delete
    await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { 
        isActive: false,
        endDate: new Date(),
      },
    });

    return {
      success: true,
      message: 'Team member removed successfully',
    };
  }

  async getEmployeeTeams(employeeId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: {
        employeeId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            department: {
              select: { id: true, code: true, name: true },
            },
            teamLead: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: memberships.map(m => ({
        ...m.team,
        membership: {
          role: m.role,
          allocationPercentage: m.allocationPercentage,
          startDate: m.startDate,
          endDate: m.endDate,
        },
      })),
    };
  }
}
