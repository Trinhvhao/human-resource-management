import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Discipline, CreateDisciplineData, UpdateDisciplineData } from '@/types/discipline';

interface QueryDisciplineParams {
  employeeId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class DisciplineService {
  async getAll(params?: QueryDisciplineParams): Promise<ApiResponse<Discipline[]>> {
    return axiosInstance.get('/disciplines', { params });
  }

  async getById(id: string): Promise<ApiResponse<Discipline>> {
    return axiosInstance.get(`/disciplines/${id}`);
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<Discipline[]>> {
    return axiosInstance.get(`/disciplines/employee/${employeeId}`);
  }

  async create(data: CreateDisciplineData): Promise<ApiResponse<Discipline>> {
    return axiosInstance.post('/disciplines', data);
  }

  async update(id: string, data: UpdateDisciplineData): Promise<ApiResponse<Discipline>> {
    return axiosInstance.patch(`/disciplines/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/disciplines/${id}`);
  }
}

export default new DisciplineService();
