import axiosInstance from '@/lib/axios';
import { ApiResponse } from '@/types/api';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

class UploadService {
  async uploadAvatar(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async uploadContract(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return axiosInstance.post('/upload/contract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async uploadDocument(file: File, type: string): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return axiosInstance.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
}

export default new UploadService();
