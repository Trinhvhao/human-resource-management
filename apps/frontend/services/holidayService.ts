import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Holiday, CreateHolidayData, UpdateHolidayData, WorkDaysCalculation } from '@/types/holiday';

interface QueryHolidayParams {
  year?: number;
  isRecurring?: boolean;
}

class HolidayService {
  async getAll(params?: QueryHolidayParams): Promise<ApiResponse<Holiday[]>> {
    return axiosInstance.get('/holidays', { params });
  }

  async getById(id: string): Promise<ApiResponse<Holiday>> {
    return axiosInstance.get(`/holidays/${id}`);
  }

  async create(data: CreateHolidayData): Promise<ApiResponse<Holiday>> {
    return axiosInstance.post('/holidays', data);
  }

  async update(id: string, data: UpdateHolidayData): Promise<ApiResponse<Holiday>> {
    return axiosInstance.patch(`/holidays/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/holidays/${id}`);
  }

  async calculateWorkDays(startDate: string, endDate: string): Promise<ApiResponse<WorkDaysCalculation>> {
    return axiosInstance.get('/holidays/work-days', {
      params: { startDate, endDate }
    });
  }
}

export default new HolidayService();
