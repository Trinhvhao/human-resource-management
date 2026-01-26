import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @Get('overview')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get dashboard overview',
    description: 'Get overall statistics including employees, attendance, leave requests, contracts, and payroll'
  })
  @ApiResponse({ status: 200, description: 'Overview data retrieved successfully' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('employee-stats')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get employee statistics',
    description: 'Get employee distribution by department, status, and gender'
  })
  @ApiResponse({ status: 200, description: 'Employee statistics retrieved' })
  getEmployeeStats() {
    return this.dashboardService.getEmployeeStats();
  }

  @Get('attendance-summary')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get attendance summary',
    description: 'Get attendance summary with daily trend for a specific month'
  })
  @ApiQuery({ name: 'month', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiResponse({ status: 200, description: 'Attendance summary retrieved' })
  getAttendanceSummary(@Query('month') month?: number, @Query('year') year?: number) {
    return this.dashboardService.getAttendanceSummary(
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }

  @Get('payroll-summary')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get payroll summary',
    description: 'Get payroll summary by month for a specific year'
  })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiResponse({ status: 200, description: 'Payroll summary retrieved' })
  getPayrollSummary(@Query('year') year?: number) {
    return this.dashboardService.getPayrollSummary(year ? +year : undefined);
  }

  @Get('alerts')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get system alerts',
    description: 'Get alerts for expiring contracts, pending leave requests, and frequent late employees'
  })
  @ApiResponse({ status: 200, description: 'Alerts retrieved' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('activities')
  @Roles('ADMIN', 'HR_MANAGER', 'EMPLOYEE')
  @ApiOperation({
    summary: 'Get recent activities',
    description: 'Get recent system activities including employee updates, leave requests, and attendance'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Recent activities retrieved' })
  getRecentActivities(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivities(limit ? +limit : 10);
  }
}
