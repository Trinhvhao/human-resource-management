import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PayrollsService } from './payrolls.service';
import { CreatePayrollDto, UpdatePayrollItemDto } from './dto/payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payrolls')
@ApiBearerAuth('JWT-auth')
@Controller('payrolls')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) { }

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get all payrolls' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'LOCKED'] })
  findAll(@Query() query: { year?: number; status?: string }) {
    return this.payrollsService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get payroll by ID', description: 'Get payroll with all items' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  findOne(@Param('id') id: string) {
    return this.payrollsService.findOne(id);
  }

  @Get('payslip/:employeeId/:month/:year')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get payslip', description: 'Get employee payslip for a month' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiParam({ name: 'month', description: 'Month (1-12)' })
  @ApiParam({ name: 'year', description: 'Year' })
  getPayslip(
    @Param('employeeId') employeeId: string,
    @Param('month') month: number,
    @Param('year') year: number,
  ) {
    return this.payrollsService.getPayslip(employeeId, +month, +year);
  }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create payroll', description: 'Create monthly payroll and calculate salaries' })
  @ApiResponse({ status: 201, description: 'Payroll created' })
  @ApiResponse({ status: 409, description: 'Payroll already exists' })
  create(@Body() dto: CreatePayrollDto) {
    return this.payrollsService.create(dto);
  }

  @Patch(':id/items/:itemId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update payroll item', description: 'Adjust salary components' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiParam({ name: 'itemId', description: 'Payroll item UUID' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePayrollItemDto,
  ) {
    return this.payrollsService.updateItem(id, itemId, dto);
  }

  @Post(':id/finalize')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Finalize payroll', description: 'Lock payroll for payment' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  finalize(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollsService.finalize(id, user.id);
  }

  // Employee Payslip Endpoints
  @Get('my-payslips/list')
  @Roles('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get my payslips', description: 'Get all payslips for current user' })
  getMyPayslips(@CurrentUser() user: any) {
    return this.payrollsService.getEmployeePayslips(user.employeeId);
  }

  @Get('my-payslips/:itemId')
  @Roles('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get my payslip detail' })
  @ApiParam({ name: 'itemId', description: 'Payroll item UUID' })
  getMyPayslip(@Param('itemId') itemId: string, @CurrentUser() user: any) {
    return this.payrollsService.getEmployeePayslipDetail(user.employeeId, itemId);
  }

  @Get('my-ytd-summary')
  @Roles('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get YTD summary', description: 'Year-to-date income and tax summary' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getYTDSummary(@CurrentUser() user: any, @Query('year') year?: number) {
    const currentYear = year || new Date().getFullYear();
    return this.payrollsService.getYTDSummary(user.employeeId, currentYear);
  }

  // =====================================================
  // PAYROLL WORKFLOW ENDPOINTS
  // =====================================================

  @Post(':id/submit')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Submit payroll for approval', description: 'Change status from DRAFT to PENDING_APPROVAL' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 200, description: 'Payroll submitted for approval' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  submitForApproval(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollsService.submitForApproval(id, user.id);
  }

  @Post(':id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve payroll', description: 'Change status from PENDING_APPROVAL to APPROVED' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 200, description: 'Payroll approved' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  approvePayroll(
    @Param('id') id: string,
    @Body() dto: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.payrollsService.approvePayroll(id, user.id, dto);
  }

  @Post(':id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject payroll', description: 'Change status from PENDING_APPROVAL to REJECTED' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 200, description: 'Payroll rejected' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  rejectPayroll(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.payrollsService.rejectPayroll(id, user.id, dto);
  }

  @Post(':id/lock')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Lock payroll', description: 'Change status from APPROVED to LOCKED after payment' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 200, description: 'Payroll locked' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  lockPayroll(@Param('id') id: string, @CurrentUser() user: any) {
    return this.payrollsService.lockPayroll(id, user.id);
  }

  @Post(':id/create-revision')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create revision', description: 'Create new version of LOCKED payroll' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 201, description: 'Revision created' })
  @ApiResponse({ status: 400, description: 'Can only create revision from LOCKED payroll' })
  createRevision(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.payrollsService.createRevision(id, user.id, dto);
  }

  @Get(':id/history')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get approval history', description: 'Get timeline of all status changes' })
  @ApiParam({ name: 'id', description: 'Payroll UUID' })
  @ApiResponse({ status: 200, description: 'Approval history retrieved' })
  getApprovalHistory(@Param('id') id: string) {
    return this.payrollsService.getApprovalHistory(id);
  }

  @Post('bulk-approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Bulk approve payrolls', description: 'Approve multiple payrolls at once' })
  @ApiResponse({ status: 200, description: 'Bulk approval completed' })
  bulkApprove(@Body() dto: { payrollIds: string[]; notes?: string }, @CurrentUser() user: any) {
    return this.payrollsService.bulkApprove(dto.payrollIds, user.id, dto.notes);
  }
}
