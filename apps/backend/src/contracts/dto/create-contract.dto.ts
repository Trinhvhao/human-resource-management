import { IsString, IsDateString, IsOptional, IsUUID, IsNumber, Min, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 'PERMANENT', enum: ['PROBATION', 'FIXED_TERM', 'PERMANENT'], description: 'Contract type' })
  @IsEnum(['PROBATION', 'FIXED_TERM', 'PERMANENT'])
  contractType: string;

  @ApiProperty({ example: 'HD-2024-001', required: false, description: 'Contract number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contractNumber?: string;

  @ApiProperty({ example: '2024-01-01', description: 'Contract start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-01', required: false, description: 'Contract end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 15000000, description: 'Contract salary (VND)' })
  @IsNumber()
  @Min(0)
  salary: number;

  @ApiProperty({ example: 'Điều khoản hợp đồng...', required: false })
  @IsOptional()
  @IsString()
  terms?: string;
}
