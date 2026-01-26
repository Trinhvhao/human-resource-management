import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, ApproveRejectDto } from './dto/create-leave-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Leave Requests')
@ApiBearerAuth('JWT-auth')
@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get()
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get all leave requests' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: { employeeId?: string; status?: string; page?: number; limit?: number }) {
    return this.leaveRequestsService.findAll(query);
  }

  @Get('pending')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get pending requests', description: 'Get all pending leave requests for approval' })
  findPending() {
    return this.leaveRequestsService.findPending();
  }

  @Get('my-requests')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get my leave requests', description: 'Get current user leave requests' })
  getMyRequests(@CurrentUser() user: any) {
    return this.leaveRequestsService.findByEmployee(user.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get employee leave requests' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.leaveRequestsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get leave request by ID' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Create leave request', description: 'Submit a new leave request' })
  @ApiResponse({ status: 201, description: 'Leave request created' })
  create(@Body() dto: CreateLeaveRequestDto, @CurrentUser() user: any) {
    return this.leaveRequestsService.create(dto, user.id, user.employeeId);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leaveRequestsService.approve(id, user.id);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  reject(@Param('id') id: string, @Body() dto: ApproveRejectDto, @CurrentUser() user: any) {
    return this.leaveRequestsService.reject(id, user.id, dto.rejectedReason);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Cancel leave request', description: 'Cancel own pending request' })
  @ApiParam({ name: 'id', description: 'Leave request UUID' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.leaveRequestsService.cancel(id, user.id, user.employeeId);
  }
}
