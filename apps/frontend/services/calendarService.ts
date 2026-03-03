import axiosInstance from '@/lib/axios';
import { CalendarResponse, CalendarStatsResponse, CreateScheduleDto, UpdateScheduleDto, BulkCreateScheduleDto } from '@/types/calendar';

class CalendarService {
    async getMyCalendar(startDate: string, endDate: string): Promise<CalendarResponse> {
        return axiosInstance.get('/calendar/my-calendar', {
            params: { startDate, endDate },
        });
    }

    async getCalendarStats(month: number, year: number): Promise<CalendarStatsResponse> {
        return axiosInstance.get('/calendar/stats', {
            params: { month, year },
        });
    }

    async createSchedule(data: CreateScheduleDto) {
        return axiosInstance.post('/calendar/schedules', data);
    }

    async getSchedule(id: string) {
        return axiosInstance.get(`/calendar/schedules/${id}`);
    }

    async updateSchedule(id: string, data: UpdateScheduleDto) {
        return axiosInstance.put(`/calendar/schedules/${id}`, data);
    }

    async deleteSchedule(id: string) {
        return axiosInstance.delete(`/calendar/schedules/${id}`);
    }

    async bulkCreateSchedules(data: BulkCreateScheduleDto) {
        return axiosInstance.post('/calendar/schedules/bulk', data);
    }

    async checkConflicts(employeeId: string, startDate: string, endDate: string) {
        return axiosInstance.get('/calendar/schedules/conflicts/check', {
            params: { employeeId, startDate, endDate },
        });
    }
}

export default new CalendarService();
