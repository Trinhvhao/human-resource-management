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

      // Business Rule: Prevent creating too deep hierarchy (max 2 levels)
      if (parent.parentId) {
        throw new BadRequestException('Cannot create department more than 2 levels deep. Teams can only be children of main departments.');
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

      // Business Rule: Manager must belong to the same department (or parent if creating child)
      if (dto.parentId) {
        // For child departments (teams), manager should be from parent department
        if (manager.departmentId !== dto.parentId) {
          throw new BadRequestException('Team manager must be an employee of the parent department');
        }
      }

      // Business Rule: Manager cannot manage multiple departments
      const existingManagement = await this.prisma.department.findFirst({
        where: {
          managerId: dto.managerId,
          isActive: true,
        },
      });

      if (existingManagement) {
        throw new BadRequestException(`This employee is already managing ${existingManagement.name}`);
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
        children: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
            _count: {
              select: {
                employees: true,
              },
            },
          },
          where: { isActive: true },
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
      include: {
        _count: {
          select: { employees: true }
        }
      }
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
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Department cannot be its own parent');
      }

      if (dto.parentId) {
        const parent = await this.prisma.department.findUnique({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new BadRequestException('Parent department not found');
        }

        // Business Rule: Prevent circular references
        await this.checkCircularReference(id, dto.parentId);

        // Business Rule: Prevent too deep hierarchy
        if (parent.parentId) {
          throw new BadRequestException('Cannot create department more than 2 levels deep');
        }

        // Business Rule: Cannot change parent if department has employees
        if (department.parentId !== dto.parentId && department._count.employees > 0) {
          throw new BadRequestException('Cannot change parent department when department has employees. Move employees first.');
        }
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

      // Business Rule: Manager cannot manage multiple departments
      const existingManagement = await this.prisma.department.findFirst({
        where: {
          managerId: dto.managerId,
          isActive: true,
          id: { not: id }, // Exclude current department
        },
      });

      if (existingManagement) {
        throw new BadRequestException(`This employee is already managing ${existingManagement.name}`);
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
            teams: true,
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
      include: {
        user: true
      }
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // Business Rule: Manager must be active
    if (manager.status !== 'ACTIVE') {
      throw new BadRequestException('Manager must be an active employee');
    }

    // Business Rule: Manager cannot manage multiple departments
    const existingManagement = await this.prisma.department.findFirst({
      where: {
        managerId: managerId,
        isActive: true,
        id: { not: departmentId },
      },
    });

    if (existingManagement) {
      throw new BadRequestException(`This employee is already managing ${existingManagement.name}`);
    }

    // Business Rule: Ensure manager has appropriate user role
    if (manager.user && manager.user.role === 'EMPLOYEE') {
      // Auto-upgrade to MANAGER role
      await this.prisma.user.update({
        where: { id: manager.user.id },
        data: { role: 'MANAGER' }
      });
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

  /**
   * Check for circular reference in department hierarchy
   */
  private async checkCircularReference(departmentId: string, newParentId: string): Promise<void> {
    let currentParentId: string | null = newParentId;
    const visited = new Set<string>([departmentId]);

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        throw new BadRequestException('Circular reference detected in department hierarchy');
      }

      visited.add(currentParentId);

      const parent = await this.prisma.department.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });

      if (!parent) break;
      currentParentId = parent.parentId;
    }
  }

  /**
   * Validate department hierarchy integrity
   */
  async validateHierarchyIntegrity(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check for orphaned departments
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    for (const dept of departments) {
      // Check if parent exists but is inactive
      if (dept.parentId && dept.parent && !dept.parent.isActive) {
        issues.push(`Department "${dept.name}" has inactive parent "${dept.parent.name}"`);
      }

      // Check for departments with no employees and no children
      const hasChildren = departments.some(d => d.parentId === dept.id);
      if (dept._count.employees === 0 && !hasChildren && !dept.parentId) {
        issues.push(`Department "${dept.name}" has no employees and no sub-departments`);
      }
    }

    return {
      success: issues.length === 0,
      issues
    };
  }

  async getPerformanceStats() {
    // Use optimized view instead of N+1 queries
    const currentMonthStats: any[] = await this.prisma.$queryRaw`
      SELECT 
        department_id as "departmentId",
        department_code as "departmentCode",
        department_name as "departmentName",
        employee_count as "employeeCount",
        attendance_rate as "attendanceRate",
        on_time_rate as "onTimeRate",
        performance_score as "performanceScore"
      FROM vw_department_performance_current_month
      WHERE employee_count > 0
      ORDER BY performance_score DESC
    `;

    const lastMonthStats: any[] = await this.prisma.$queryRaw`
      SELECT 
        department_id as "departmentId",
        attendance_rate as "lastMonthRate"
      FROM vw_department_performance_last_month
      WHERE total_attendance > 0
    `;

    // Create map for quick lookup
    const lastMonthMap = new Map(
      lastMonthStats.map(s => [s.departmentId, s.lastMonthRate])
    );

    // Calculate trends
    const performanceStats = currentMonthStats.map(stat => {
      const lastMonthRate = lastMonthMap.get(stat.departmentId) || 0;
      const difference = stat.attendanceRate - lastMonthRate;
      
      let trend: 'up' | 'down' | 'stable';
      if (Math.abs(difference) < 2) {
        trend = 'stable';
      } else if (difference > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      const trendPercentage = lastMonthRate > 0 
        ? ((stat.attendanceRate - lastMonthRate) / lastMonthRate) * 100 
        : 0;

      return {
        ...stat,
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
      };
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      success: true,
      data: performanceStats,
      meta: {
        period: 'month',
        startDate: startOfMonth,
        endDate: endOfMonth,
        totalDepartments: performanceStats.length,
      },
    };
  }

  async getDepartmentPerformance(id: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get current month performance
    const currentPerf: any[] = await this.prisma.$queryRaw`
      SELECT 
        department_id as "departmentId",
        department_code as "departmentCode",
        department_name as "departmentName",
        employee_count as "employeeCount",
        total_attendance as "totalAttendance",
        present_count as "presentCount",
        late_count as "lateCount",
        attendance_rate as "attendanceRate",
        on_time_rate as "onTimeRate",
        performance_score as "performanceScore"
      FROM vw_department_performance_current_month
      WHERE department_id = ${id}::uuid
    `;

    if (currentPerf.length === 0) {
      throw new NotFoundException('Department performance data not found');
    }

    const perf = currentPerf[0];

    // Convert BigInt to Number for perf data
    const perfData = {
      departmentId: perf.departmentId,
      departmentCode: perf.departmentCode,
      departmentName: perf.departmentName,
      employeeCount: Number(perf.employeeCount),
      totalAttendance: Number(perf.totalAttendance),
      presentCount: Number(perf.presentCount),
      lateCount: Number(perf.lateCount),
      attendanceRate: Number(perf.attendanceRate),
      onTimeRate: Number(perf.onTimeRate),
      performanceScore: Number(perf.performanceScore),
    };

    // Get last month for trend
    const lastMonthPerf: any[] = await this.prisma.$queryRaw`
      SELECT 
        attendance_rate as "lastMonthRate"
      FROM vw_department_performance_last_month
      WHERE department_id = ${id}::uuid
    `;

    const lastMonthRate = Number(lastMonthPerf[0]?.lastMonthRate || 0);
    const difference = perfData.attendanceRate - lastMonthRate;
    
    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(difference) < 2) {
      trend = 'stable';
    } else if (difference > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    // Get top performers
    const topPerformersRaw: any[] = await this.prisma.$queryRaw`
      SELECT 
        e.id,
        e.employee_code as "employeeCode",
        e.full_name as "fullName",
        e.position,
        COUNT(a.id) FILTER (WHERE a.status = 'PRESENT') as "presentDays",
        COUNT(a.id) as "totalDays",
        COUNT(a.id) FILTER (WHERE a.is_late = true) as "lateDays",
        ROUND(
          (COUNT(a.id) FILTER (WHERE a.status = 'PRESENT')::numeric / 
           NULLIF(COUNT(a.id), 0)::numeric) * 100, 
          1
        ) as "attendanceRate"
      FROM employees e
      LEFT JOIN attendances a ON e.id = a.employee_id 
        AND a.date >= ${startOfMonth}
        AND a.date <= ${endOfMonth}
      WHERE e.department_id = ${id}::uuid
        AND e.status = 'ACTIVE'
      GROUP BY e.id, e.employee_code, e.full_name, e.position
      HAVING COUNT(a.id) > 0
      ORDER BY "attendanceRate" DESC, "lateDays" ASC
      LIMIT 5
    `;

    // Convert BigInt to Number
    const topPerformers = topPerformersRaw.map(p => ({
      ...p,
      presentDays: Number(p.presentDays),
      totalDays: Number(p.totalDays),
      lateDays: Number(p.lateDays),
      attendanceRate: Number(p.attendanceRate),
    }));

    // Get 6-month trend
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const trendDataRaw: any[] = await this.prisma.$queryRaw`
      WITH monthly_stats AS (
        SELECT 
          DATE_TRUNC('month', a.date) as month,
          COUNT(*) FILTER (WHERE a.status = 'PRESENT') as present_count,
          COUNT(*) as total_count
        FROM attendances a
        JOIN employees e ON a.employee_id = e.id
        WHERE e.department_id = ${id}::uuid
          AND a.date >= ${sixMonthsAgo}
          AND a.date <= ${endOfMonth}
        GROUP BY DATE_TRUNC('month', a.date)
      )
      SELECT 
        TO_CHAR(month, 'Mon') as "monthLabel",
        ROUND((present_count::numeric / total_count::numeric) * 100, 1) as "attendanceRate"
      FROM monthly_stats
      ORDER BY month ASC
    `;

    // Convert BigInt to Number for trend data
    const trendData = trendDataRaw.map(t => ({
      monthLabel: t.monthLabel,
      attendanceRate: Number(t.attendanceRate),
    }));

    return {
      success: true,
      data: {
        ...perfData,
        trend,
        trendPercentage: lastMonthRate > 0 
          ? Math.round(((perfData.attendanceRate - lastMonthRate) / lastMonthRate) * 100 * 10) / 10
          : 0,
        lastMonthRate,
        topPerformers,
        trendData,
        period: {
          start: startOfMonth,
          end: endOfMonth,
        },
      },
    };
  }
}
