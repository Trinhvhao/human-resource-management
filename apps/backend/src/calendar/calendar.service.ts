import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';

@Injectable()
export class CalendarService {
    constructor(private prisma: PrismaService) { }

    async getEmployeeCalendar(employeeId: string, startDate: string, endDate: string) {
        const events: any[] = [];

        // 1. Work schedules
        const schedules = await this.prisma.workSchedule.findMany({
            where: {
                employeeId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });

        schedules.forEach(schedule => {
            events.push({
                id: schedule.id,
                title: `Làm việc - ${this.getShiftLabel(schedule.shiftType)}`,
                startDate: schedule.startTime,
                endDate: schedule.endTime,
                type: 'work',
                description: schedule.notes,
                allDay: false,
            });
        });

        // 2. Leave requests (approved)
        const leaves = await this.prisma.leaveRequest.findMany({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: {
                    lte: new Date(endDate),
                },
                endDate: {
                    gte: new Date(startDate),
                },
            },
        });

        leaves.forEach(leave => {
            events.push({
                id: leave.id,
                title: `Nghỉ phép - ${leave.leaveType}`,
                startDate: leave.startDate,
                endDate: leave.endDate,
                type: 'leave',
                description: leave.reason,
                allDay: true,
            });
        });

        // 3. Overtime (approved)
        const overtimes = await this.prisma.overtimeRequest.findMany({
            where: {
                employeeId,
                status: 'APPROVED',
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });

        overtimes.forEach(overtime => {
            events.push({
                id: overtime.id,
                title: `Tăng ca - ${overtime.hours}h`,
                startDate: overtime.startTime,
                endDate: overtime.endTime,
                type: 'overtime',
                description: overtime.reason,
                allDay: false,
            });
        });

        // 4. Holidays
        const holidays = await this.prisma.holiday.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
        });

        holidays.forEach(holiday => {
            events.push({
                id: holiday.id,
                title: holiday.name,
                startDate: holiday.date,
                endDate: holiday.date,
                type: 'holiday',
                description: 'Ngày lễ',
                allDay: true,
            });
        });

        return { success: true, data: events };
    }

    async getCalendarStats(employeeId: string, month: number, year: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Count work days
        const workDays = await this.prisma.workSchedule.count({
            where: {
                employeeId,
                date: { gte: startDate, lte: endDate },
                isWorkDay: true,
            },
        });

        // Count leave days
        const leaveDays = await this.prisma.leaveRequest.count({
            where: {
                employeeId,
                status: 'APPROVED',
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });

        // Sum overtime hours
        const overtimeResult = await this.prisma.overtimeRequest.aggregate({
            where: {
                employeeId,
                status: 'APPROVED',
                date: { gte: startDate, lte: endDate },
            },
            _sum: {
                hours: true,
            },
        });

        // Count holidays
        const holidays = await this.prisma.holiday.count({
            where: {
                date: { gte: startDate, lte: endDate },
            },
        });

        return {
            success: true,
            data: {
                workDays,
                leaveDays,
                overtimeHours: Number(overtimeResult._sum.hours || 0),
                holidays,
            },
        };
    }

    private getShiftLabel(shiftType: string): string {
        const labels: Record<string, string> = {
            MORNING: 'Sáng',
            AFTERNOON: 'Chiều',
            FULL_DAY: 'Cả ngày',
            NIGHT: 'Tối',
            CUSTOM: 'Tùy chỉnh',
        };
        return labels[shiftType] || shiftType;
    }

    // ==================== SCHEDULE MANAGEMENT ====================

    async createSchedule(dto: CreateScheduleDto, userId: string) {
        // Validate employee exists and is active
        const employee = await this.prisma.employee.findUnique({
            where: { id: dto.employeeId },
            include: {
                contracts: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        startDate: 'desc',
                    },
                    take: 1,
                },
            },
        });

        if (!employee) {
            throw new NotFoundException('Nhân viên không tồn tại');
        }

        // Check employee status
        if (employee.status !== 'ACTIVE') {
            throw new BadRequestException('Chỉ có thể tạo lịch cho nhân viên đang làm việc');
        }

        // Validate schedule date is within contract period
        const scheduleDate = new Date(dto.date);
        const activeContract = employee.contracts[0];

        if (!activeContract) {
            throw new BadRequestException('Nhân viên không có hợp đồng hiệu lực');
        }

        if (scheduleDate < activeContract.startDate) {
            throw new BadRequestException('Ngày làm việc phải sau ngày bắt đầu hợp đồng');
        }

        if (activeContract.endDate && scheduleDate > activeContract.endDate) {
            throw new BadRequestException('Ngày làm việc phải trước ngày kết thúc hợp đồng');
        }

        // Check for approved leave on this date
        const approvedLeave = await this.prisma.leaveRequest.findFirst({
            where: {
                employeeId: dto.employeeId,
                status: 'APPROVED',
                startDate: { lte: scheduleDate },
                endDate: { gte: scheduleDate },
            },
        });

        if (approvedLeave) {
            throw new BadRequestException(
                `Không thể tạo lịch làm việc trong ngày nghỉ phép (${approvedLeave.leaveType})`
            );
        }

        // Check for conflicts
        await this.checkScheduleConflict(dto.employeeId, dto.date, dto.startTime, dto.endTime);

        // Validate time range
        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);

        if (startTime >= endTime) {
            throw new BadRequestException('Thời gian bắt đầu phải trước thời gian kết thúc');
        }

        // Create schedule
        const schedule = await this.prisma.workSchedule.create({
            data: {
                employeeId: dto.employeeId,
                date: scheduleDate,
                shiftType: dto.shiftType,
                startTime: startTime,
                endTime: endTime,
                isWorkDay: dto.isWorkDay ?? true,
                notes: dto.notes,
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
            data: schedule,
            message: 'Tạo lịch làm việc thành công',
        };
    }

    async updateSchedule(id: string, dto: UpdateScheduleDto, userId: string) {
        // Check if schedule exists
        const existingSchedule = await this.prisma.workSchedule.findUnique({
            where: { id },
        });

        if (!existingSchedule) {
            throw new NotFoundException('Lịch làm việc không tồn tại');
        }

        // If changing date or time, check for conflicts
        if (dto.date || dto.startTime || dto.endTime) {
            const checkDate = dto.date || existingSchedule.date.toISOString().split('T')[0];
            const checkStartTime = dto.startTime || existingSchedule.startTime.toISOString();
            const checkEndTime = dto.endTime || existingSchedule.endTime.toISOString();

            await this.checkScheduleConflict(
                existingSchedule.employeeId,
                checkDate,
                checkStartTime,
                checkEndTime,
                id
            );
        }

        // Validate time range if both times are provided
        if (dto.startTime && dto.endTime) {
            const startTime = new Date(dto.startTime);
            const endTime = new Date(dto.endTime);

            if (startTime >= endTime) {
                throw new BadRequestException('Thời gian bắt đầu phải trước thời gian kết thúc');
            }
        }

        // Update schedule
        const schedule = await this.prisma.workSchedule.update({
            where: { id },
            data: {
                ...(dto.date && { date: new Date(dto.date) }),
                ...(dto.shiftType && { shiftType: dto.shiftType }),
                ...(dto.startTime && { startTime: new Date(dto.startTime) }),
                ...(dto.endTime && { endTime: new Date(dto.endTime) }),
                ...(dto.isWorkDay !== undefined && { isWorkDay: dto.isWorkDay }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
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
            data: schedule,
            message: 'Cập nhật lịch làm việc thành công',
        };
    }

    async deleteSchedule(id: string, userId: string) {
        // Check if schedule exists
        const schedule = await this.prisma.workSchedule.findUnique({
            where: { id },
        });

        if (!schedule) {
            throw new NotFoundException('Lịch làm việc không tồn tại');
        }

        // Delete schedule
        await this.prisma.workSchedule.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Xóa lịch làm việc thành công',
        };
    }

    async getScheduleById(id: string) {
        const schedule = await this.prisma.workSchedule.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        fullName: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!schedule) {
            throw new NotFoundException('Lịch làm việc không tồn tại');
        }

        return {
            success: true,
            data: schedule,
        };
    }

    async bulkCreateSchedules(dto: BulkCreateScheduleDto, userId: string) {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as any[],
        };

        // Validate all employees exist and are active
        const employeeIds = [...new Set(dto.schedules.map(s => s.employeeId))];
        const employees = await this.prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: {
                id: true,
                status: true,
                contracts: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        startDate: 'desc',
                    },
                    take: 1,
                },
            },
        });

        const employeeMap = new Map(employees.map(e => [e.id, e]));

        // Get all approved leaves for these employees
        const startDates = dto.schedules.map(s => new Date(s.date));
        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...startDates.map(d => d.getTime())));

        const approvedLeaves = await this.prisma.leaveRequest.findMany({
            where: {
                employeeId: { in: employeeIds },
                status: 'APPROVED',
                startDate: { lte: maxDate },
                endDate: { gte: minDate },
            },
            select: {
                employeeId: true,
                startDate: true,
                endDate: true,
                leaveType: true,
            },
        });

        // Create a map for quick leave lookup
        const leaveMap = new Map<string, any[]>();
        approvedLeaves.forEach(leave => {
            if (!leaveMap.has(leave.employeeId)) {
                leaveMap.set(leave.employeeId, []);
            }
            leaveMap.get(leave.employeeId)!.push(leave);
        });

        for (const scheduleData of dto.schedules) {
            try {
                // Check if employee exists
                const employee = employeeMap.get(scheduleData.employeeId);
                if (!employee) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Nhân viên không tồn tại',
                    });
                    continue;
                }

                // Check employee status
                if (employee.status !== 'ACTIVE') {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Nhân viên không ở trạng thái làm việc',
                    });
                    continue;
                }

                // Check contract
                const activeContract = employee.contracts[0];
                if (!activeContract) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Không có hợp đồng hiệu lực',
                    });
                    continue;
                }

                const scheduleDate = new Date(scheduleData.date);
                if (scheduleDate < activeContract.startDate ||
                    (activeContract.endDate && scheduleDate > activeContract.endDate)) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Ngày làm việc ngoài thời hạn hợp đồng',
                    });
                    continue;
                }

                // Check for approved leave
                const employeeLeaves = leaveMap.get(scheduleData.employeeId) || [];
                const hasLeave = employeeLeaves.some(leave =>
                    scheduleDate >= leave.startDate && scheduleDate <= leave.endDate
                );

                if (hasLeave) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Ngày nghỉ phép đã được duyệt',
                    });
                    continue;
                }

                // Check for conflicts
                const hasConflict = await this.hasScheduleConflict(
                    scheduleData.employeeId,
                    scheduleData.date,
                    scheduleData.startTime,
                    scheduleData.endTime
                );

                if (hasConflict) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Trùng lịch làm việc',
                    });
                    continue;
                }

                // Validate time range
                const startTime = new Date(scheduleData.startTime);
                const endTime = new Date(scheduleData.endTime);

                if (startTime >= endTime) {
                    results.failed++;
                    results.errors.push({
                        employeeId: scheduleData.employeeId,
                        date: scheduleData.date,
                        error: 'Thời gian không hợp lệ',
                    });
                    continue;
                }

                // Create schedule
                await this.prisma.workSchedule.create({
                    data: {
                        employeeId: scheduleData.employeeId,
                        date: scheduleDate,
                        shiftType: scheduleData.shiftType,
                        startTime: startTime,
                        endTime: endTime,
                        isWorkDay: true,
                        notes: scheduleData.notes,
                    },
                });

                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    employeeId: scheduleData.employeeId,
                    date: scheduleData.date,
                    error: error.message || 'Lỗi không xác định',
                });
            }
        }

        return {
            success: true,
            data: results,
            message: `Tạo thành công ${results.success}/${dto.schedules.length} lịch làm việc`,
        };
    }

    async checkScheduleConflicts(employeeId: string, startDate: string, endDate: string) {
        const conflicts = await this.prisma.workSchedule.findMany({
            where: {
                employeeId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
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
            orderBy: {
                date: 'asc',
            },
        });

        return {
            success: true,
            data: {
                hasConflicts: conflicts.length > 0,
                conflicts,
            },
        };
    }

    // ==================== HELPER METHODS ====================

    private async checkScheduleConflict(
        employeeId: string,
        date: string,
        startTime: string,
        endTime: string,
        excludeId?: string
    ) {
        const hasConflict = await this.hasScheduleConflict(
            employeeId,
            date,
            startTime,
            endTime,
            excludeId
        );

        if (hasConflict) {
            throw new BadRequestException('Lịch làm việc bị trùng với lịch đã có');
        }
    }

    private async hasScheduleConflict(
        employeeId: string,
        date: string,
        startTime: string,
        endTime: string,
        excludeId?: string
    ): Promise<boolean> {
        const scheduleDate = new Date(date);
        const newStartTime = new Date(startTime);
        const newEndTime = new Date(endTime);

        const existingSchedules = await this.prisma.workSchedule.findMany({
            where: {
                employeeId,
                date: scheduleDate,
                ...(excludeId && { id: { not: excludeId } }),
            },
        });

        // Check for time overlap
        for (const schedule of existingSchedules) {
            const existingStart = schedule.startTime;
            const existingEnd = schedule.endTime;

            // Check if times overlap
            const hasOverlap =
                (newStartTime >= existingStart && newStartTime < existingEnd) ||
                (newEndTime > existingStart && newEndTime <= existingEnd) ||
                (newStartTime <= existingStart && newEndTime >= existingEnd);

            if (hasOverlap) {
                return true;
            }
        }

        return false;
    }
}
