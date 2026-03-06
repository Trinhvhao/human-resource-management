import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Overtime, CreateOvertimeData, RejectOvertimeData, OvertimeReport } from '@/types/overtime';

interface QueryOvertimeParams {
  status?: string;
  employeeId?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

class OvertimeService {
  async getAll(params?: QueryOvertimeParams): Promise<ApiResponse<Overtime[]>> {
    return axiosInstance.get('/overtime', { params });
  }

  async getById(id: string): Promise<ApiResponse<Overtime>> {
    return axiosInstance.get(`/overtime/${id}`);
  }

  async getMyRequests(): Promise<ApiResponse<Overtime[]>> {
    return axiosInstance.get('/overtime/my-requests');
  }

  async getPending(): Promise<ApiResponse<Overtime[]>> {
    return axiosInstance.get('/overtime/pending');
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<Overtime[]>> {
    return axiosInstance.get(`/overtime/employee/${employeeId}`);
  }

  async create(data: CreateOvertimeData): Promise<ApiResponse<Overtime>> {
    return axiosInstance.post('/overtime', data);
  }

  async createForEmployee(employeeId: string, data: CreateOvertimeData): Promise<ApiResponse<Overtime>> {
    return axiosInstance.post(`/overtime/employee/${employeeId}`, data);
  }

  async approve(id: string): Promise<ApiResponse<Overtime>> {
    return axiosInstance.post(`/overtime/${id}/approve`);
  }

  async reject(id: string, data: RejectOvertimeData): Promise<ApiResponse<Overtime>> {
    return axiosInstance.post(`/overtime/${id}/reject`, data);
  }

  async cancel(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/overtime/${id}`);
  }

  async getApprovedHours(employeeId: string, month: number, year: number): Promise<ApiResponse<{ totalHours: number }>> {
    return axiosInstance.get(`/overtime/employee/${employeeId}/hours/${month}/${year}`);
  }

  async getMonthlyReport(month: number, year: number): Promise<ApiResponse<OvertimeReport>> {
    return axiosInstance.get(`/overtime/report/${month}/${year}`);
  }
}

export default new OvertimeService();
