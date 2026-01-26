import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectAttendanceCorrectionDto {
  @ApiProperty({ 
    example: 'Không có bằng chứng xác thực', 
    description: 'Lý do từ chối' 
  })
  @IsString()
  @IsNotEmpty()
  rejectedReason: string;
}
