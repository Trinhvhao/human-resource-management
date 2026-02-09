import { IsString, IsDateString, IsOptional, IsNumber, Min, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContractDto {
  @ApiProperty({ example: 'FIXED_TERM', enum: ['PROBATION', 'FIXED_TERM', 'INDEFINITE'], required: false })
  @IsOptional()
  @IsEnum(['PROBATION', 'FIXED_TERM', 'INDEFINITE'])
  contractType?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 18000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiProperty({ example: 'FULL_TIME', enum: ['FULL_TIME', 'PART_TIME'], required: false })
  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME'])
  workType?: string;

  @ApiProperty({ example: 40, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  workHoursPerWeek?: number;

  @ApiProperty({ example: 'Điều khoản cập nhật...', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ example: 'Ghi chú cập nhật', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'EXPIRED', 'TERMINATED'])
  status?: string;
}

export class RenewContractDto {
  @ApiProperty({ example: '2026-01-01', description: 'New end date' })
  @IsDateString()
  newEndDate: string;

  @ApiProperty({ example: 20000000, required: false, description: 'New salary' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newSalary?: number;

  @ApiProperty({ example: 'FIXED_TERM', enum: ['PROBATION', 'FIXED_TERM', 'INDEFINITE'], required: false })
  @IsOptional()
  @IsEnum(['PROBATION', 'FIXED_TERM', 'INDEFINITE'])
  newContractType?: string;
}

export class TerminateContractDto {
  @ApiProperty({ example: 'Nghỉ việc theo nguyện vọng cá nhân', description: 'Termination reason' })
  @IsString()
  reason: string;
}
