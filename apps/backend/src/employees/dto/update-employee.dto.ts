import { IsString, IsEmail, IsDateString, IsEnum, IsOptional, IsUUID, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiProperty({ example: 'Nguyễn Văn A', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ example: '1990-01-15', required: false })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({ example: '001234567890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  idCard?: string;

  @ApiProperty({ example: 'Hà Nội', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'nva@company.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', required: false })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ example: 'Senior Software Engineer', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'])
  status?: string;

  @ApiProperty({ example: 18000000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseSalary?: number;
}
