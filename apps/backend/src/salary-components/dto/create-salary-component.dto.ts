import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsDateString, Min, IsString } from 'class-validator';

export enum ComponentType {
  BASIC = 'BASIC',
  LUNCH = 'LUNCH',
  TRANSPORT = 'TRANSPORT',
  PHONE = 'PHONE',
  HOUSING = 'HOUSING',
  POSITION = 'POSITION',
  BONUS = 'BONUS',
  OTHER = 'OTHER',
}

export class CreateSalaryComponentDto {
  @ApiProperty({ description: 'ID nhân viên (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  employeeId: string;

  @ApiProperty({ 
    description: 'Loại thành phần lương', 
    enum: ComponentType,
    example: 'LUNCH' 
  })
  @IsEnum(ComponentType)
  componentType: ComponentType;

  @ApiProperty({ description: 'Số tiền', example: 1000000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Ngày hiệu lực', 
    example: '2026-01-01',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiProperty({ 
    description: 'Ghi chú', 
    example: 'Phụ cấp ăn trưa',
    required: false 
  })
  @IsOptional()
  note?: string;
}
