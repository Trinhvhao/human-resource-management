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
  constructor(private readonly payrollsService: PayrollsService) {}

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get all payrolls' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'FINALIZED'] })
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
}
