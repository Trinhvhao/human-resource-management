import axiosInstance from '@/lib/axios';

interface ExportParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  month?: number;
  year?: number;
}

class ExportService {
  async exportEmployees(params?: ExportParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/employees', {
      params,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  async exportAttendance(params?: ExportParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/attendance', {
      params,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  async exportPayroll(params?: ExportParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/payroll', {
      params,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  async exportLeaves(params?: ExportParams): Promise<Blob> {
    const response = await axiosInstance.get('/export/leaves', {
      params,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export default new ExportService();
