import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ApproveTerminationDto {
    @IsUUID()
    @IsNotEmpty()
    approverId: string;

    @IsString()
    @IsOptional()
    comments?: string;
}
