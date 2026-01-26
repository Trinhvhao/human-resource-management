import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendances')
@ApiBearerAuth('JWT-auth')
@Controller('attendances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post('check-in')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Check in', description: 'Record check-in time for current user' })
  @ApiResponse({ status: 201, description: 'Checked in successfully' })
  @ApiResponse({ status: 400, description: 'Already checked in today' })
  checkIn(@CurrentUser() user: any) {
    return this.attendancesService.checkIn(user.employeeId);
  }

  @Post('check-in/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Check in for employee', description: 'Record check-in for specific employee (HR only)' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  checkInForEmployee(@Param('employeeId') employeeId: string) {
    return this.attendancesService.checkIn(employeeId);
  }

  @Post('check-out')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Check out', description: 'Record check-out time for current user' })
  @ApiResponse({ status: 201, description: 'Checked out successfully' })
  @ApiResponse({ status: 400, description: 'No check-in record found' })
  checkOut(@CurrentUser() user: any) {
    return this.attendancesService.checkOut(user.employeeId);
  }

  @Post('check-out/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Check out for employee', description: 'Record check-out for specific employee (HR only)' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  checkOutForEmployee(@Param('employeeId') employeeId: string) {
    return this.attendancesService.checkOut(employeeId);
  }

  @Get('today')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get today attendance', description: 'Get current user attendance for today' })
  getToday(@CurrentUser() user: any) {
    return this.attendancesService.getTodayAttendance(user.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get employee attendances', description: 'Get attendance records for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  getEmployeeAttendances(
    @Param('employeeId') employeeId: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.attendancesService.getEmployeeAttendances(employeeId, month, year);
  }

  @Get('report')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get monthly report', description: 'Get attendance report for all employees' })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  getMonthlyReport(@Query('month') month: number, @Query('year') year: number) {
    return this.attendancesService.getMonthlyReport(month, year);
  }

  @Get('statistics')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get attendance statistics', description: 'Get statistics for a month' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getStatistics(@Query('month') month?: number, @Query('year') year?: number) {
    return this.attendancesService.getStatistics(month, year);
  }
}
