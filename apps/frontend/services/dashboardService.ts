import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface DashboardOverview {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  newEmployeesThisMonth: number;
  attendanceRate: number;
  pendingLeaveRequests: number;
  pendingOvertimeRequests: number;
  expiringContracts: number;
}

export interface DashboardAlert {
  id: string;
  type: 'CONTRACT_EXPIRING' | 'LEAVE_PENDING' | 'OVERTIME_PENDING' | 'LATE_ATTENDANCE';
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  link?: string;
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

class DashboardService {
  async getOverview(): Promise<ApiResponse<DashboardOverview>> {
    return axiosInstance.get('/dashboard/overview');
  }

  async getAlerts(): Promise<ApiResponse<DashboardAlert[]>> {
    return axiosInstance.get('/dashboard/alerts');
  }

  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return axiosInstance.get('/dashboard/activities', { params: { limit } });
  }

  async getAttendanceChart(days: number = 7): Promise<ApiResponse<any>> {
    return axiosInstance.get('/dashboard/attendance-chart', { params: { days } });
  }

  async getEmployeeDistribution(): Promise<ApiResponse<any>> {
    return axiosInstance.get('/dashboard/employee-distribution');
  }
}

export default new DashboardService();
