export type CalendarEventType = 'work' | 'leave' | 'overtime' | 'holiday';

export interface CalendarEvent {
    id: string;
    title: string;
    startDate: string | Date;
    endDate: string | Date;
    type: CalendarEventType;
    description?: string;
    allDay: boolean;
}

export interface CalendarStats {
    workDays: number;
    leaveDays: number;
    overtimeHours: number;
    holidays: number;
}

export interface CalendarResponse {
    success: boolean;
    data: CalendarEvent[];
}

export interface CalendarStatsResponse {
    success: boolean;
    data: CalendarStats;
}

export enum ShiftType {
    MORNING = 'MORNING',
    AFTERNOON = 'AFTERNOON',
    FULL_DAY = 'FULL_DAY',
    NIGHT = 'NIGHT',
    CUSTOM = 'CUSTOM',
}

export interface CreateScheduleDto {
    employeeId: string;
    date: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    isWorkDay?: boolean;
    notes?: string;
}

export interface UpdateScheduleDto extends Partial<CreateScheduleDto> { }

export interface BulkScheduleItem {
    employeeId: string;
    date: string;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    notes?: string;
}

export interface BulkCreateScheduleDto {
    schedules: BulkScheduleItem[];
}
