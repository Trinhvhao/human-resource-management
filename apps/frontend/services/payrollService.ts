import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { Payroll, CreatePayrollData, UpdatePayrollItemData, Payslip } from '@/types/payroll';

interface QueryPayrollParams {
  year?: number;
  status?: string;
}

class PayrollService {
  async getAll(params?: QueryPayrollParams): Promise<ApiResponse<Payroll[]>> {
    return axiosInstance.get('/payrolls', { params });
  }

  async getById(id: string): Promise<ApiResponse<Payroll>> {
    return axiosInstance.get(`/payrolls/${id}`);
  }

  async create(data: CreatePayrollData): Promise<ApiResponse<Payroll>> {
    return axiosInstance.post('/payrolls', data);
  }

  async updateItem(payrollId: string, itemId: string, data: UpdatePayrollItemData): Promise<ApiResponse<any>> {
    return axiosInstance.patch(`/payrolls/${payrollId}/items/${itemId}`, data);
  }

  async finalize(id: string): Promise<ApiResponse<Payroll>> {
    return axiosInstance.post(`/payrolls/${id}/finalize`);
  }

  async getPayslip(employeeId: string, month: number, year: number): Promise<ApiResponse<Payslip>> {
    return axiosInstance.get(`/payrolls/payslip/${employeeId}/${month}/${year}`);
  }
}

export default new PayrollService();
