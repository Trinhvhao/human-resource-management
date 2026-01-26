import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto, RenewContractDto, TerminateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Contracts')
@ApiBearerAuth('JWT-auth')
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get all contracts', description: 'List contracts with filters' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  findAll(@Query() query: { employeeId?: string; status?: string; page?: number; limit?: number }) {
    return this.contractsService.findAll(query);
  }

  @Get('expiring')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get expiring contracts', description: 'Get contracts expiring within X days' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ status: 200, description: 'Expiring contracts retrieved' })
  getExpiringContracts(@Query('days') days?: number) {
    return this.contractsService.getExpiringContracts(days || 30);
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get contracts by employee', description: 'Get all contracts for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.contractsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiResponse({ status: 200, description: 'Contract found' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create contract', description: 'Create a new contract for employee' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 409, description: 'Employee already has active contract' })
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update contract' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Post(':id/renew')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Renew contract', description: 'Create new contract from existing one' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiResponse({ status: 201, description: 'Contract renewed successfully' })
  renew(@Param('id') id: string, @Body() renewDto: RenewContractDto) {
    return this.contractsService.renew(id, renewDto);
  }

  @Post(':id/terminate')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Terminate contract', description: 'End contract with reason' })
  @ApiParam({ name: 'id', description: 'Contract UUID' })
  @ApiResponse({ status: 200, description: 'Contract terminated successfully' })
  terminate(@Param('id') id: string, @Body() terminateDto: TerminateContractDto) {
    return this.contractsService.terminate(id, terminateDto);
  }
}
