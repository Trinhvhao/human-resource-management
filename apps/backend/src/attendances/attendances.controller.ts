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
  constructor(private readonly attendancesService: AttendancesService) { }

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

  @Get('my')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get my attendances', description: 'Get attendance records for the currently logged-in employee' })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 3 })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  getMyAttendances(
    @CurrentUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.attendancesService.getEmployeeAttendances(user.employeeId, month, year);
  }

  @Get('today/all')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get all today attendances', description: 'Get all employees attendance for today (Admin only)' })
  getTodayAll() {
    return this.attendancesService.getTodayAllAttendances();
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
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

  @Get('absenteeism-stats')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get absenteeism statistics',
    description: 'Get absenteeism and late statistics for today, week, and month with trend data'
  })
  @ApiResponse({ status: 200, description: 'Absenteeism statistics retrieved' })
  getAbsenteeismStats() {
    return this.attendancesService.getAbsenteeismStats();
  }

  @Post('auto-mark-absent')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Manually trigger auto-absent marking',
    description: 'Mark employees as absent if they did not check-in (normally runs automatically at 7 PM)'
  })
  @ApiResponse({ status: 201, description: 'Auto-absent marking completed' })
  manualAutoMarkAbsent() {
    return this.attendancesService.autoMarkAbsent();
  }

  @Get('validate')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Validate attendance data',
    description: 'Check for missing days and incomplete records for a specific month'
  })
  @ApiQuery({ name: 'month', required: true, type: Number, example: 2 })
  @ApiQuery({ name: 'year', required: true, type: Number, example: 2026 })
  @ApiResponse({ status: 200, description: 'Validation results returned' })
  validateAttendanceData(@Query('month') month: number, @Query('year') year: number) {
    return this.attendancesService.validateAttendanceData(Number(month), Number(year));
  }
}
