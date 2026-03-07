import { IsString, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', required: false, description: 'Employee ID (HR can create for others)' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiProperty({ example: 'ANNUAL', enum: ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER'] })
  @IsEnum(['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER'])
  leaveType: string;

  @ApiProperty({ example: '2026-01-20', description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-22', description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'Nghỉ phép năm', description: 'Reason for leave' })
  @IsString()
  reason: string;
}

export class ApproveRejectDto {
  @ApiProperty({ example: 'Không đủ điều kiện', required: false, description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectedReason?: string;
}
