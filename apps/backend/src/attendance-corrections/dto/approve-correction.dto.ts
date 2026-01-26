import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveAttendanceCorrectionDto {
  @ApiProperty({ 
    example: 'Đã xác nhận với quản lý trực tiếp', 
    description: 'Ghi chú khi duyệt',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
