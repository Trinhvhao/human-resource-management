import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceCorrectionsService } from './attendance-corrections.service';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { ApproveAttendanceCorrectionDto } from './dto/approve-correction.dto';
import { RejectAttendanceCorrectionDto } from './dto/reject-correction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendance Corrections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance-corrections')
export class AttendanceCorrectionsController {
  constructor(
    private readonly attendanceCorrectionsService: AttendanceCorrectionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu điều chỉnh chấm công' })
  create(
    @CurrentUser() user: any,
    @Body() createDto: CreateAttendanceCorrectionDto,
  ) {
    return this.attendanceCorrectionsService.create(
      user.employeeId,
      createDto,
    );
  }

  @Post('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Tạo yêu cầu điều chỉnh cho nhân viên (HR)' })
  createForEmployee(
    @Param('employeeId') employeeId: string,
    @Body() createDto: CreateAttendanceCorrectionDto,
  ) {
    return this.attendanceCorrectionsService.create(employeeId, createDto);
  }

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Danh sách yêu cầu điều chỉnh' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] })
  @ApiQuery({ name: 'employeeId', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.attendanceCorrectionsService.findAll(status, employeeId);
  }

  @Get('pending')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Danh sách yêu cầu chờ duyệt' })
  findPending() {
    return this.attendanceCorrectionsService.findPending();
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Yêu cầu điều chỉnh của tôi' })
  findMyRequests(@CurrentUser() user: any) {
    return this.attendanceCorrectionsService.findByEmployee(user.employeeId);
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Yêu cầu điều chỉnh theo nhân viên' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.attendanceCorrectionsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết yêu cầu điều chỉnh' })
  findOne(@Param('id') id: string) {
    return this.attendanceCorrectionsService.findOne(id);
  }

  @Post(':id/approve')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Duyệt yêu cầu điều chỉnh' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() approveDto?: ApproveAttendanceCorrectionDto,
  ) {
    return this.attendanceCorrectionsService.approve(id, user.id, approveDto);
  }

  @Post(':id/reject')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Từ chối yêu cầu điều chỉnh' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() rejectDto: RejectAttendanceCorrectionDto,
  ) {
    return this.attendanceCorrectionsService.reject(id, user.id, rejectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy yêu cầu điều chỉnh' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.attendanceCorrectionsService.cancel(id, user.employeeId);
  }
}
