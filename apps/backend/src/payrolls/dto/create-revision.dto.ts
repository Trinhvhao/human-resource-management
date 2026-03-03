import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRevisionDto {
    @ApiProperty({
        description: 'Reason for creating revision',
        example: 'Cần điều chỉnh lương nhân viên B do tính sai overtime',
    })
    @IsNotEmpty({ message: 'Lý do tạo phiên bản mới không được để trống' })
    @IsString()
    reason: string;
}
