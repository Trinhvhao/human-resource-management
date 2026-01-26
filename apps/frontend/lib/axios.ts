import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiResponse } from '@/types/api';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Return data directly if it's an ApiResponse
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && !originalRequest.url?.includes('/auth/refresh')) {
        try {
          const response = await axios.post<ApiResponse<{ accessToken: string }>>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { refreshToken }
          );
          
          const { accessToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or already tried refresh, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    // Handle other errors
    const apiError: ApiError = error.response?.data || {
      success: false,
      statusCode: error.response?.status || 500,
      message: error.message || 'An error occurred',
      timestamp: new Date().toISOString(),
      path: originalRequest?.url || '',
    };

    return Promise.reject(apiError);
  }
);

export default axiosInstance;
