import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

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
