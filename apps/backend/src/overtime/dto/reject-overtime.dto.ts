import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectOvertimeDto {
  @ApiProperty({ 
    example: 'Không có yêu cầu từ quản lý dự án', 
    description: 'Lý do từ chối' 
  })
  @IsString()
  @IsNotEmpty()
  rejectedReason: string;
}
