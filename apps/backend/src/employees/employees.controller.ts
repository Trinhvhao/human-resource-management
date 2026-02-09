import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) { }

  @Get()
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get all employees', description: 'List employees with pagination, search and filters' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  findAll(@Query() query: QueryEmployeesDto) {
    return this.employeesService.findAll(query);
  }

  @Get('statistics')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get employee statistics', description: 'Get statistics by status, department, gender' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getStatistics() {
    return this.employeesService.getStatistics();
  }

  @Get('without-active-contract')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get employees without active contract',
    description: 'Get list of active employees who do not have an active contract. Used for creating new contracts.'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 100, description: 'Max results to return' })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  getEmployeesWithoutActiveContract(@Query('limit') limit?: string) {
    return this.employeesService.getEmployeesWithoutActiveContract(limit ? +limit : 100);
  }

  @Post('recalculate-profiles')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Recalculate all profile completions',
    description: 'Recalculate profile completion percentage for all employees. Use after updating calculation logic.'
  })
  @ApiResponse({ status: 200, description: 'Profile completions recalculated successfully' })
  recalculateProfiles() {
    return this.employeesService.recalculateAllProfileCompletions();
  }

  @Get('top-performers')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({
    summary: 'Get top performing employees',
    description: 'Get top employees based on attendance, punctuality, and rewards'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5, description: 'Number of top performers to return' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month'], example: 'month', description: 'Performance period' })
  @ApiResponse({ status: 200, description: 'Top performers retrieved successfully' })
  getTopPerformers(
    @Query('limit') limit?: number,
    @Query('period') period?: string,
  ) {
    return this.employeesService.getTopPerformers(
      limit ? +limit : 5,
      period as 'week' | 'month' || 'month',
    );
  }

  @Get('generate-code')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Generate next employee code', description: 'Get the next available employee code' })
  @ApiResponse({ status: 200, description: 'Employee code generated successfully' })
  async generateCode() {
    const code = await this.employeesService.generateNextEmployeeCode();
    return {
      success: true,
      data: { employeeCode: code },
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get employee by ID', description: 'Get detailed employee information' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee found' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Get(':id/history')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get employee change history', description: 'Get history of changes for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getHistory(@Param('id') id: string) {
    return this.employeesService.getHistory(id);
  }

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Create employee', description: 'Create a new employee record' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 409, description: 'Email or ID card already exists' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update employee', description: 'Update employee information' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user?.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Terminate employee', description: 'Soft delete - change status to TERMINATED' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee terminated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  delete(@Param('id') id: string) {
    return this.employeesService.delete(id);
  }

  // =====================================================
  // EMPLOYEE PROFILE ENDPOINTS
  // =====================================================

  @Get(':id/profile')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get employee profile', description: 'Get full employee profile with extended information and documents' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getProfile(@Param('id') id: string) {
    return this.employeesService.getEmployeeProfile(id);
  }

  @Patch(':id/profile')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Update employee profile', description: 'Update extended employee profile information' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateEmployeeProfileDto,
  ) {
    return this.employeesService.updateEmployeeProfile(id, updateProfileDto);
  }

  @Post(':id/avatar')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Upload employee avatar', description: 'Upload or update employee profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.uploadDocument(
      id,
      file,
      'AVATAR',
      'Employee avatar',
      user?.id,
    );
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Upload employee document', description: 'Upload employee documents (resume, ID card, certificates, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `doc-${uniqueSuffix}-${sanitizedName}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new Error('Only PDF, images, and Word documents are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('description') description: string,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.uploadDocument(
      id,
      file,
      documentType,
      description,
      user?.id,
    );
  }

  @Get(':id/documents')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get employee documents', description: 'Get all documents for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by document type' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getDocuments(
    @Param('id') id: string,
    @Query('type') type?: string,
  ) {
    return this.employeesService.getEmployeeDocuments(id, type);
  }

  @Delete(':id/documents/:documentId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Delete employee document', description: 'Delete a specific employee document' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiParam({ name: 'documentId', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.employeesService.deleteDocument(id, documentId);
  }

  @Get('stats/profile-completion')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get profile completion statistics', description: 'Get statistics about employee profile completion' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getProfileCompletionStats() {
    return this.employeesService.getProfileCompletionStats();
  }

  // =====================================================
  // EMPLOYEE ACTIVITY ENDPOINTS
  // =====================================================

  @Get(':id/activities')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ summary: 'Get employee activities', description: 'Get activity timeline for an employee' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by activity type' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getActivities(
    @Param('id') id: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.employeesService.getEmployeeActivities({
      employeeId: id,
      activityType: type,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }

  @Get(':id/activities/stats')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Get employee activity statistics', description: 'Get statistics about employee activities' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  getActivityStats(@Param('id') id: string) {
    return this.employeesService.getActivityStats(id);
  }
}
