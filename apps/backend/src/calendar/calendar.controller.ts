import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BulkCreateScheduleDto } from './dto/bulk-create-schedule.dto';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
    constructor(private calendarService: CalendarService) { }

    @Get('my-calendar')
    @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
    @ApiOperation({ summary: 'Get my work calendar' })
    @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
    async getMyCalendar(
        @CurrentUser() user: any,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.calendarService.getEmployeeCalendar(user.employeeId, startDate, endDate);
    }

    @Get('stats')
    @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
    @ApiOperation({ summary: 'Get calendar stats for a month' })
    @ApiQuery({ name: 'month', required: true, type: Number })
    @ApiQuery({ name: 'year', required: true, type: Number })
    async getStats(
        @CurrentUser() user: any,
        @Query('month') month: number,
        @Query('year') year: number,
    ) {
        return this.calendarService.getCalendarStats(user.employeeId, +month, +year);
    }

    // ==================== SCHEDULE MANAGEMENT ====================

    @Post('schedules')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Create work schedule (HR/Admin only)' })
    @ApiBody({ type: CreateScheduleDto })
    async createSchedule(
        @Body() dto: CreateScheduleDto,
        @CurrentUser() user: any,
    ) {
        return this.calendarService.createSchedule(dto, user.id);
    }

    @Get('schedules/:id')
    @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
    @ApiOperation({ summary: 'Get schedule by ID' })
    async getSchedule(@Param('id') id: string) {
        return this.calendarService.getScheduleById(id);
    }

    @Put('schedules/:id')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Update work schedule (HR/Admin only)' })
    @ApiBody({ type: UpdateScheduleDto })
    async updateSchedule(
        @Param('id') id: string,
        @Body() dto: UpdateScheduleDto,
        @CurrentUser() user: any,
    ) {
        return this.calendarService.updateSchedule(id, dto, user.id);
    }

    @Delete('schedules/:id')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Delete work schedule (HR/Admin only)' })
    async deleteSchedule(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        return this.calendarService.deleteSchedule(id, user.id);
    }

    @Post('schedules/bulk')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Bulk create work schedules (HR/Admin only)' })
    @ApiBody({ type: BulkCreateScheduleDto })
    async bulkCreateSchedules(
        @Body() dto: BulkCreateScheduleDto,
        @CurrentUser() user: any,
    ) {
        return this.calendarService.bulkCreateSchedules(dto, user.id);
    }

    @Get('schedules/conflicts/check')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Check schedule conflicts' })
    @ApiQuery({ name: 'employeeId', required: true })
    @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
    async checkConflicts(
        @Query('employeeId') employeeId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        return this.calendarService.checkScheduleConflicts(employeeId, startDate, endDate);
    }
}
