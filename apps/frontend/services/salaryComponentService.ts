import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { 
  SalaryComponent, 
  CreateSalaryComponentData, 
  UpdateSalaryComponentData,
  EmployeeSalaryStructure 
} from '@/types/salaryComponent';

interface QueryParams {
  employeeId?: string;
  componentType?: string;
  isActive?: boolean;
}

class SalaryComponentService {
  async getAll(params?: QueryParams): Promise<ApiResponse<SalaryComponent[]>> {
    return axiosInstance.get('/salary-components', { params });
  }

  async getById(id: string): Promise<ApiResponse<SalaryComponent>> {
    return axiosInstance.get(`/salary-components/${id}`);
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<EmployeeSalaryStructure>> {
    return axiosInstance.get(`/salary-components/employee/${employeeId}`);
  }

  async create(data: CreateSalaryComponentData): Promise<ApiResponse<SalaryComponent>> {
    return axiosInstance.post('/salary-components', data);
  }

  async update(id: string, data: UpdateSalaryComponentData): Promise<ApiResponse<SalaryComponent>> {
    return axiosInstance.patch(`/salary-components/${id}`, data);
  }

  async deactivate(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.post(`/salary-components/${id}/deactivate`);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return axiosInstance.delete(`/salary-components/${id}`);
  }
}

export default new SalaryComponentService();
