import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPayrollDto {
    @ApiProperty({
        description: 'Reason for rejection (required)',
        example: 'Có sai sót trong tính lương nhân viên A. Vui lòng kiểm tra lại.',
    })
    @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
    @IsString()
    reason: string;
}
