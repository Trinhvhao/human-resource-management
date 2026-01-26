import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOvertimeDto {
  @ApiProperty({ example: '2026-01-15', description: 'Ngày tăng ca' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ 
    example: '2026-01-15T17:30:00Z', 
    description: 'Giờ bắt đầu tăng ca' 
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ 
    example: '2026-01-15T20:30:00Z', 
    description: 'Giờ kết thúc tăng ca' 
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ 
    example: 3, 
    description: 'Số giờ tăng ca' 
  })
  @IsNumber()
  @Min(0.5)
  hours: number;

  @ApiProperty({ 
    example: 'Hoàn thành dự án khẩn cấp', 
    description: 'Lý do tăng ca' 
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
