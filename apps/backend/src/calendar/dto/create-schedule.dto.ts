import { IsUUID, IsDateString, IsEnum, IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ShiftType {
    MORNING = 'MORNING',
    AFTERNOON = 'AFTERNOON',
    FULL_DAY = 'FULL_DAY',
    NIGHT = 'NIGHT',
    CUSTOM = 'CUSTOM',
}

export class CreateScheduleDto {
    @ApiProperty({ description: 'Employee ID' })
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: 'Schedule date (YYYY-MM-DD)' })
    @IsDateString()
    date: string;

    @ApiProperty({ enum: ShiftType, description: 'Shift type' })
    @IsEnum(ShiftType)
    shiftType: ShiftType;

    @ApiProperty({ description: 'Start time (ISO 8601)' })
    @IsDateString()
    startTime: string;

    @ApiProperty({ description: 'End time (ISO 8601)' })
    @IsDateString()
    endTime: string;

    @ApiProperty({ description: 'Is work day', default: true })
    @IsBoolean()
    @IsOptional()
    isWorkDay?: boolean;

    @ApiProperty({ description: 'Notes', required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}
