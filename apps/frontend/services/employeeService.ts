import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeStatistics } from '@/types/employee';

interface QueryEmployeesParams {
  search?: string;
  departmentId?: string;
  position?: string;
  status?: string;
  gender?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class EmployeeService {
  async getAll(params?: QueryEmployeesParams): Promise<ApiResponse<Employee[]>> {
    return axiosInstance.get('/employees', { params });
  }

  async getById(id: string): Promise<ApiResponse<Employee>> {
    return axiosInstance.get(`/employees/${id}`);
  }

  async create(data: CreateEmployeeData): Promise<ApiResponse<Employee>> {
    return axiosInstance.post('/employees', data);
  }

  async update(id: string, data: UpdateEmployeeData): Promise<ApiResponse<Employee>> {
    return axiosInstance.patch(`/employees/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/employees/${id}`);
  }

  async getStatistics(): Promise<ApiResponse<EmployeeStatistics>> {
    return axiosInstance.get('/employees/statistics');
  }

  async getHistory(id: string): Promise<ApiResponse<any[]>> {
    return axiosInstance.get(`/employees/${id}/history`);
  }

  async generateCode(): Promise<ApiResponse<{ employeeCode: string }>> {
    return axiosInstance.get('/employees/generate-code');
  }
}

export default new EmployeeService();
