import { IsInt, Min, Max, IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollDto {
  @ApiProperty({ example: 1, description: 'Month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  @Min(2020)
  year: number;
}

export class UpdatePayrollItemDto {
  @ApiProperty({ example: 500000, required: false, description: 'Allowances' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @ApiProperty({ example: 1000000, required: false, description: 'Bonus' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @ApiProperty({ example: 200000, required: false, description: 'Deduction' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deduction?: number;

  @ApiProperty({ example: 10, required: false, description: 'Overtime hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  @ApiProperty({ example: 'Thưởng dự án', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
