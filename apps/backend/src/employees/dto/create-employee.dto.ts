import { IsString, IsEmail, IsDateString, IsEnum, IsOptional, IsUUID, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Full name of employee' })
  @IsString()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '1990-01-15', description: 'Date of birth (YYYY-MM-DD)' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({ example: '001234567890', description: 'ID card number (CCCD/CMND)' })
  @IsString()
  @MaxLength(50)
  idCard: string;

  @ApiProperty({ example: 'Hà Nội', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ example: 'nva@company.com', description: 'Employee email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Department ID' })
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job position' })
  @IsString()
  @MaxLength(100)
  position: string;

  @ApiProperty({ example: '2024-01-01', description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: 15000000, description: 'Base salary (VND)' })
  @IsNumber()
  @Min(0)
  baseSalary: number;
}
