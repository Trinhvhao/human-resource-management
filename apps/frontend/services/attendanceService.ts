import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';
import {
  Attendance,
  CheckInData,
  AttendanceReport,
  AttendanceCorrection,
  CreateCorrectionData,
  AttendanceStatistics
} from '@/types/attendance';

interface QueryAttendanceParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  page?: number;
  limit?: number;
}

class AttendanceService {
  // Check-in/out
  async checkIn(): Promise<ApiResponse<Attendance>> {
    return axiosInstance.post('/attendances/check-in');
  }

  async checkOut(): Promise<ApiResponse<Attendance>> {
    return axiosInstance.post('/attendances/check-out');
  }

  async getTodayAttendance(): Promise<ApiResponse<Attendance | null>> {
    return axiosInstance.get('/attendances/today');
  }

  // Employee attendances
  async getEmployeeAttendances(employeeId: string, month?: number, year?: number): Promise<ApiResponse<{
    data: Attendance[];
    summary: {
      totalDays: number;
      presentDays: number;
      lateDays: number;
      earlyLeaveDays: number;
      totalWorkHours: number;
    };
    meta: { month: number; year: number };
  }>> {
    return axiosInstance.get(`/attendances/employee/${employeeId}`, {
      params: { month, year }
    });
  }

  // Reports and statistics
  async getMonthlyReport(month: number, year: number): Promise<ApiResponse<AttendanceReport>> {
    return axiosInstance.get('/attendances/report', {
      params: { month, year }
    });
  }

  async getStatistics(month?: number, year?: number): Promise<ApiResponse<AttendanceStatistics>> {
    return axiosInstance.get('/attendances/statistics', {
      params: { month, year }
    });
  }

  // Get all employees' today attendance (for admin)
  async getTodayAllAttendances(): Promise<ApiResponse<Attendance[]>> {
    return axiosInstance.get('/attendances/today/all');
  }

  // Attendance Corrections
  async getCorrections(params?: { status?: string; employeeId?: string }): Promise<ApiResponse<AttendanceCorrection[]>> {
    return axiosInstance.get('/attendance-corrections', { params });
  }

  async getPendingCorrections(): Promise<ApiResponse<AttendanceCorrection[]>> {
    return axiosInstance.get('/attendance-corrections/pending');
  }

  async getMyCorrections(): Promise<ApiResponse<AttendanceCorrection[]>> {
    return axiosInstance.get('/attendance-corrections/my-requests');
  }

  async getCorrectionById(id: string): Promise<ApiResponse<AttendanceCorrection>> {
    return axiosInstance.get(`/attendance-corrections/${id}`);
  }

  async createCorrection(data: CreateCorrectionData): Promise<ApiResponse<AttendanceCorrection>> {
    return axiosInstance.post('/attendance-corrections', data);
  }

  async approveCorrection(id: string): Promise<ApiResponse<AttendanceCorrection>> {
    return axiosInstance.post(`/attendance-corrections/${id}/approve`);
  }

  async rejectCorrection(id: string, rejectedReason: string): Promise<ApiResponse<AttendanceCorrection>> {
    return axiosInstance.post(`/attendance-corrections/${id}/reject`, { rejectedReason });
  }

  async cancelCorrection(id: string): Promise<ApiResponse<AttendanceCorrection>> {
    return axiosInstance.delete(`/attendance-corrections/${id}`);
  }

  // Attendance Management (Admin only)
  async validateAttendance(month: number, year: number): Promise<ApiResponse<any>> {
    return axiosInstance.get('/attendances/validate', {
      params: { month, year }
    });
  }

  async autoMarkAbsent(): Promise<ApiResponse<any>> {
    return axiosInstance.post('/attendances/auto-mark-absent');
  }
}

export default new AttendanceService();
