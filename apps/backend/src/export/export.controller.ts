import { Controller, Get, Query, Param, Res, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('employees')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Export danh sách nhân viên ra Excel' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'position', required: false })
  async exportEmployees(
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('position') position?: string,
    @Res() res: Response = null as any,
  ) {
    const buffer = await this.exportService.exportEmployees({
      departmentId,
      status,
      position,
    });

    const filename = `Danh_sach_nhan_vien_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('attendance/:month/:year')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Export báo cáo chấm công theo tháng' })
  @ApiParam({ name: 'month', type: Number })
  @ApiParam({ name: 'year', type: Number })
  @ApiQuery({ name: 'employeeId', required: false })
  async exportAttendance(
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
    @Query('employeeId') employeeId?: string,
    @Res() res: Response = null as any,
  ) {
    const buffer = await this.exportService.exportAttendance(month, year, employeeId);

    const filename = `Cham_cong_${month}_${year}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('payroll/:payrollId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Export bảng lương ra Excel' })
  @ApiParam({ name: 'payrollId', description: 'Payroll UUID' })
  async exportPayroll(
    @Param('payrollId') payrollId: string,
    @Res() res: Response = null as any,
  ) {
    const buffer = await this.exportService.exportPayroll(payrollId);

    const filename = `Bang_luong_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('leave-requests')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Export danh sách đơn nghỉ phép' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  async exportLeaveRequests(
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res: Response = null as any,
  ) {
    const buffer = await this.exportService.exportLeaveRequests({
      status,
      employeeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    const filename = `Don_nghi_phep_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
