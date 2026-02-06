import axiosInstance from '@/lib/axios';

interface ExportEmployeesParams {
  departmentId?: string;
  status?: string;
  position?: string;
}

interface ExportAttendanceParams {
  month: number;
  year: number;
  employeeId?: string;
}

interface ExportLeaveRequestsParams {
  status?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

class ExportService {
  /**
   * Export employees list to Excel
   */
  async exportEmployees(params?: ExportEmployeesParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/employees', {
      params,
      responseType: 'blob',
    });
    // Response is now the full axios response object
    return response.data;
  }

  /**
   * Export attendance report to Excel
   */
  async exportAttendance(month: number, year: number, employeeId?: string): Promise<Blob> {
    const response = await axiosInstance.get(`/export/attendance/${month}/${year}`, {
      params: { employeeId },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export payroll to Excel
   */
  async exportPayroll(payrollId: string): Promise<Blob> {
    const response = await axiosInstance.get(`/export/payroll/${payrollId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Export leave requests to Excel
   */
  async exportLeaveRequests(params?: ExportLeaveRequestsParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/leave-requests', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    try {
      // Validate blob
      if (!blob || !(blob instanceof Blob)) {
        console.error('Invalid blob:', blob);
        throw new Error('Invalid blob object');
      }

      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Download file failed:', error);
      throw new Error('Không thể tải file. Vui lòng thử lại.');
    }
  }

  /**
   * Export employees with current filters and download
   */
  async exportAndDownloadEmployees(params?: ExportEmployeesParams): Promise<void> {
    try {
      const blob = await this.exportEmployees(params);
      const filename = `Danh_sach_nhan_vien_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.downloadFile(blob, filename);
    } catch (error) {
      console.error('Export employees failed:', error);
      throw error;
    }
  }

  /**
   * Export attendance with filters and download
   */
  async exportAndDownloadAttendance(month: number, year: number, employeeId?: string): Promise<void> {
    try {
      const blob = await this.exportAttendance(month, year, employeeId);
      const filename = `Cham_cong_${month}_${year}.xlsx`;
      this.downloadFile(blob, filename);
    } catch (error) {
      console.error('Export attendance failed:', error);
      throw error;
    }
  }

  /**
   * Export payroll and download
   */
  async exportAndDownloadPayroll(payrollId: string): Promise<void> {
    try {
      const blob = await this.exportPayroll(payrollId);
      const filename = `Bang_luong_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.downloadFile(blob, filename);
    } catch (error) {
      console.error('Export payroll failed:', error);
      throw error;
    }
  }

  /**
   * Export leave requests and download
   */
  async exportAndDownloadLeaveRequests(params?: ExportLeaveRequestsParams): Promise<void> {
    try {
      const blob = await this.exportLeaveRequests(params);
      const filename = `Don_nghi_phep_${new Date().toISOString().split('T')[0]}.xlsx`;
      this.downloadFile(blob, filename);
    } catch (error) {
      console.error('Export leave requests failed:', error);
      throw error;
    }
  }
}

export default new ExportService();
