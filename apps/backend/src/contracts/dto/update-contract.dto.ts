import { IsString, IsDateString, IsOptional, IsNumber, Min, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContractDto {
  @ApiProperty({ example: 'PERMANENT', enum: ['PROBATION', 'FIXED_TERM', 'PERMANENT'], required: false })
  @IsOptional()
  @IsEnum(['PROBATION', 'FIXED_TERM', 'PERMANENT'])
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

  @ApiProperty({ example: 'Điều khoản cập nhật...', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

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

  @ApiProperty({ example: 'PERMANENT', enum: ['PROBATION', 'FIXED_TERM', 'PERMANENT'], required: false })
  @IsOptional()
  @IsEnum(['PROBATION', 'FIXED_TERM', 'PERMANENT'])
  newContractType?: string;
}

export class TerminateContractDto {
  @ApiProperty({ example: 'Nghỉ việc theo nguyện vọng cá nhân', description: 'Termination reason' })
  @IsString()
  reason: string;
}
