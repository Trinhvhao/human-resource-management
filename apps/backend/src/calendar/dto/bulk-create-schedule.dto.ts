import { IsArray, ValidateNested, IsUUID, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from './create-schedule.dto';

class BulkScheduleItem {
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

    @ApiProperty({ description: 'Notes', required: false })
    @IsOptional()
    notes?: string;
}

export class BulkCreateScheduleDto {
    @ApiProperty({ type: [BulkScheduleItem], description: 'Array of schedules to create' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkScheduleItem)
    schedules: BulkScheduleItem[];
}
