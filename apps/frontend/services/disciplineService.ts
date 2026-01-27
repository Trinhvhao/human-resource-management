import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Discipline, CreateDisciplineData } from '@/types/discipline';

interface QueryParams {
  employeeId?: string;
  page?: number;
  limit?: number;
}

class DisciplineService {
  async getAll(params?: QueryParams): Promise<ApiResponse<Discipline[]>> {
    return axiosInstance.get('/disciplines', { params });
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<Discipline[]>> {
    return axiosInstance.get(`/disciplines/employee/${employeeId}`);
  }

  async create(data: CreateDisciplineData): Promise<ApiResponse<Discipline>> {
    return axiosInstance.post('/disciplines', data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/disciplines/${id}`);
  }
}

export default new DisciplineService();
