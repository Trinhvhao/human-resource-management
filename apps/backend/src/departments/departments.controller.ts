import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { DepartmentChangeRequestsService } from './department-change-requests.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ReviewChangeRequestDto } from './dto/review-change-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly changeRequestsService: DepartmentChangeRequestsService,
  ) {}

  @Get()
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get all departments', description: 'List all active departments' })
  @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('tree')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get organization tree', description: 'Get hierarchical department structure' })
  @ApiResponse({ status: 200, description: 'Organization tree retrieved' })
  getOrganizationTree() {
    return this.departmentsService.getOrganizationTree();
  }

  @Get('performance-stats')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Get department performance statistics', 
    description: 'Get performance metrics for all departments including attendance, on-time rate, and trend' 
  })
  @ApiResponse({ status: 200, description: 'Performance statistics retrieved' })
  getPerformanceStats() {
    return this.departmentsService.getPerformanceStats();
  }

  @Get('validate/hierarchy')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Validate hierarchy integrity', 
    description: 'Check for issues in department hierarchy (orphaned departments, circular references, etc.)' 
  })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  validateHierarchy() {
    return this.departmentsService.validateHierarchyIntegrity();
  }

  // ==================== CHANGE REQUEST ENDPOINTS ====================

  @Get('change-requests')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'List change requests', description: 'Get all department change requests with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'departmentId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'Change requests retrieved' })
  getChangeRequests(
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.changeRequestsService.findAll({ status, departmentId });
  }

  @Get('change-requests/:requestId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get change request details', description: 'Get detailed information about a change request' })
  @ApiParam({ name: 'requestId', description: 'Change request UUID' })
  @ApiResponse({ status: 200, description: 'Change request found' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  getChangeRequest(@Param('requestId') requestId: string) {
    return this.changeRequestsService.findOne(requestId);
  }

  @Patch('change-requests/:requestId/review')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Review change request', description: 'Approve or reject a change request' })
  @ApiParam({ name: 'requestId', description: 'Change request UUID' })
  @ApiResponse({ status: 200, description: 'Change request reviewed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid review or request already reviewed' })
  @ApiResponse({ status: 404, description: 'Change request not found' })
  reviewChangeRequest(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewChangeRequestDto,
    @Request() req: any,
  ) {
    return this.changeRequestsService.review(requestId, req.user.id, dto);
  }

  @Post(':id/change-requests')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Create change request', description: 'Request a change to department (manager, parent, etc.)' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 201, description: 'Change request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or validation failed' })
  createChangeRequest(
    @Param('id') id: string,
    @Body() dto: CreateChangeRequestDto,
    @Request() req: any,
  ) {
    return this.changeRequestsService.create(id, req.user.id, dto);
  }

  @Get(':id/performance')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get department performance details' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Performance details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  getDepartmentPerformance(@Param('id') id: string) {
    return this.departmentsService.getDepartmentPerformance(id);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get department by ID', description: 'Get detailed department information' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department found' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create department', description: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created successfully' })
  @ApiResponse({ status: 409, description: 'Department code already exists' })
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update department', description: 'Update department information' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department updated successfully' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Delete department', description: 'Soft delete department (must have no employees)' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 200, description: 'Department deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete department with employees' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  delete(@Param('id') id: string) {
    return this.departmentsService.delete(id);
  }

  @Patch(':id/manager')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Assign manager', description: 'Assign a manager to department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiBody({ schema: { type: 'object', properties: { managerId: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 200, description: 'Manager assigned successfully' })
  @ApiResponse({ status: 404, description: 'Department or manager not found' })
  assignManager(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.departmentsService.assignManager(id, managerId);
  }
}
