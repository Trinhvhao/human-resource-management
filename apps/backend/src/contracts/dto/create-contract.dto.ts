import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({
    example: '11111111-1111-1111-1111-111111111111',
    description: 'Employee ID',
  })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    example: 'FIXED_TERM',
    enum: ['PROBATION', 'FIXED_TERM', 'INDEFINITE'],
    description:
      'Contract duration type (Thời hạn hợp đồng): PROBATION (max 60 days), FIXED_TERM (12-36 months), INDEFINITE (no end date)',
  })
  @IsEnum(['PROBATION', 'FIXED_TERM', 'INDEFINITE'])
  contractType: string;

  @ApiProperty({
    example: 'HD-2024-001',
    required: false,
    description: 'Contract number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Contract start date',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-01-01',
    required: false,
    description:
      'Contract end date (required for PROBATION and FIXED_TERM, must be null for INDEFINITE)',
  })
  @ValidateIf((o) => o.contractType !== 'INDEFINITE')
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: 15000000,
    description: 'Base salary (Lương cơ bản) in VND',
  })
  @IsNumber()
  @Min(0)
  salary: number;

  @ApiProperty({
    example: 'FULL_TIME',
    enum: ['FULL_TIME', 'PART_TIME'],
    required: false,
    description: 'Work mode (Chế độ làm việc)',
  })
  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME'])
  workType?: string;

  @ApiProperty({
    example: 40,
    required: false,
    description: 'Work hours per week',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  workHoursPerWeek?: number;

  @ApiProperty({
    example: 'Điều khoản hợp đồng...',
    required: false,
    description: 'Contract terms (Điều khoản hợp đồng)',
  })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({
    example: 'Ghi chú nội bộ',
    required: false,
    description: 'Internal notes (Ghi chú nội bộ)',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
