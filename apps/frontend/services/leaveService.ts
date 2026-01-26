import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import { LeaveRequest, CreateLeaveRequestData, LeaveBalance } from '@/types/leave';

interface QueryLeaveParams {
  status?: string;
  employeeId?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

class LeaveService {
  // Leave Requests
  async getAll(params?: QueryLeaveParams): Promise<ApiResponse<LeaveRequest[]>> {
    return axiosInstance.get('/leave-requests', { params });
  }

  async getById(id: string): Promise<ApiResponse<LeaveRequest>> {
    return axiosInstance.get(`/leave-requests/${id}`);
  }

  async getMyRequests(): Promise<ApiResponse<LeaveRequest[]>> {
    return axiosInstance.get('/leave-requests/my-requests');
  }

  async getPending(): Promise<ApiResponse<LeaveRequest[]>> {
    return axiosInstance.get('/leave-requests/pending');
  }

  async getByEmployee(employeeId: string): Promise<ApiResponse<LeaveRequest[]>> {
    return axiosInstance.get(`/leave-requests/employee/${employeeId}`);
  }

  async create(data: CreateLeaveRequestData): Promise<ApiResponse<LeaveRequest>> {
    return axiosInstance.post('/leave-requests', data);
  }

  async approve(id: string): Promise<ApiResponse<LeaveRequest>> {
    return axiosInstance.post(`/leave-requests/${id}/approve`);
  }

  async reject(id: string, rejectedReason: string): Promise<ApiResponse<LeaveRequest>> {
    return axiosInstance.post(`/leave-requests/${id}/reject`, { rejectedReason });
  }

  async cancel(id: string): Promise<ApiResponse<LeaveRequest>> {
    return axiosInstance.delete(`/leave-requests/${id}`);
  }

  // Leave Balances
  async getBalance(employeeId: string, year?: number): Promise<ApiResponse<LeaveBalance>> {
    return axiosInstance.get(`/leave-balances/employee/${employeeId}`, {
      params: { year }
    });
  }

  async getAllBalances(year?: number): Promise<ApiResponse<LeaveBalance[]>> {
    return axiosInstance.get('/leave-balances', {
      params: { year }
    });
  }

  async initBalance(employeeId: string, year: number): Promise<ApiResponse<LeaveBalance>> {
    return axiosInstance.post(`/leave-balances/employee/${employeeId}/init/${year}`);
  }

  async updateBalance(employeeId: string, year: number, annualLeave: number, sickLeave?: number): Promise<ApiResponse<LeaveBalance>> {
    return axiosInstance.patch(`/leave-balances/employee/${employeeId}/year/${year}`, {
      annualLeave,
      sickLeave
    });
  }

  // Leave Accrual
  async runAccrual(): Promise<ApiResponse<any>> {
    return axiosInstance.post('/leave-balances/accrual/run');
  }

  async accrueForEmployee(employeeId: string, daysToAdd: number, notes: string): Promise<ApiResponse<any>> {
    return axiosInstance.post(`/leave-balances/accrual/employee/${employeeId}`, {
      daysToAdd,
      notes
    });
  }

  async getAccrualHistory(employeeId?: string, year?: number, month?: number): Promise<ApiResponse<any[]>> {
    return axiosInstance.get('/leave-balances/accrual/history', {
      params: { employeeId, year, month }
    });
  }
}

export default new LeaveService();
