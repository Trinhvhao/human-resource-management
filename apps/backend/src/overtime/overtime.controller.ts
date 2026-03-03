import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OvertimeService } from './overtime.service';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { RejectOvertimeDto } from './dto/reject-overtime.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Overtime')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('overtime')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) { }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Đăng ký tăng ca' })
  create(@CurrentUser() user: any, @Body() createDto: CreateOvertimeDto) {
    return this.overtimeService.create(user.employeeId, createDto);
  }

  @Post('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Đăng ký tăng ca cho nhân viên (HR)' })
  createForEmployee(
    @Param('employeeId') employeeId: string,
    @Body() createDto: CreateOvertimeDto,
  ) {
    return this.overtimeService.create(employeeId, createDto);
  }

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Danh sách đơn tăng ca' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('month', new ParseIntPipe({ optional: true })) month?: number,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.overtimeService.findAll(status, employeeId, month, year);
  }

  @Get('pending')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Danh sách đơn chờ duyệt' })
  findPending() {
    return this.overtimeService.findPending();
  }

  @Get('my-requests')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Đơn tăng ca của tôi' })
  findMyRequests(@CurrentUser() user: any) {
    return this.overtimeService.findByEmployee(user.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Đơn tăng ca theo nhân viên' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.overtimeService.findByEmployee(employeeId);
  }

  @Get('employee/:employeeId/hours/:month/:year')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Tổng giờ tăng ca đã duyệt trong tháng' })
  getApprovedHours(
    @Param('employeeId') employeeId: string,
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.overtimeService.getApprovedOvertimeHours(employeeId, month, year);
  }

  @Get('report/:month/:year')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Báo cáo tăng ca theo tháng' })
  getMonthlyReport(
    @Param('month', ParseIntPipe) month: number,
    @Param('year', ParseIntPipe) year: number,
  ) {
    return this.overtimeService.getMonthlyReport(month, year);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Chi tiết đơn tăng ca' })
  findOne(@Param('id') id: string) {
    return this.overtimeService.findOne(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Duyệt đơn tăng ca' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.overtimeService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Từ chối đơn tăng ca' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() rejectDto: RejectOvertimeDto,
  ) {
    return this.overtimeService.reject(id, user.id, rejectDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Hủy đơn tăng ca' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.overtimeService.cancel(id, user.employeeId);
  }
}
