import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    LEAVE_APPROVED = 'LEAVE_APPROVED',
    LEAVE_REJECTED = 'LEAVE_REJECTED',
    OVERTIME_APPROVED = 'OVERTIME_APPROVED',
    OVERTIME_REJECTED = 'OVERTIME_REJECTED',
    PAYROLL_GENERATED = 'PAYROLL_GENERATED',
    CONTRACT_EXPIRING = 'CONTRACT_EXPIRING',
    REWARD_RECEIVED = 'REWARD_RECEIVED',
    DISCIPLINE_ISSUED = 'DISCIPLINE_ISSUED',
}

export class CreateNotificationDto {
    @ApiProperty({ description: 'User ID to receive notification' })
    @IsUUID()
    userId: string;

    @ApiProperty({ description: 'Notification title', example: 'Leave Request Approved' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Notification message', example: 'Your leave request has been approved' })
    @IsString()
    message: string;

    @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.INFO })
    @IsEnum(NotificationType)
    @IsOptional()
    type?: NotificationType;

    @ApiPropertyOptional({ description: 'Link to related resource', example: '/dashboard/leaves/123' })
    @IsString()
    @IsOptional()
    link?: string;
}
