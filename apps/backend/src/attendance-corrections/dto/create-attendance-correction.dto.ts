import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAttendanceCorrectionDto {
  @ApiProperty({ example: '2026-01-15', description: 'Ngày cần điều chỉnh' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ 
    example: '2026-01-15T08:30:00Z', 
    description: 'Giờ check-in đề xuất',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  requestedCheckIn?: string;

  @ApiProperty({ 
    example: '2026-01-15T17:30:00Z', 
    description: 'Giờ check-out đề xuất',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  requestedCheckOut?: string;

  @ApiProperty({ 
    example: 'Quên check-in do họp khẩn cấp', 
    description: 'Lý do điều chỉnh' 
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
