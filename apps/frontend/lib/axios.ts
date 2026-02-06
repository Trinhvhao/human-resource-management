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
    // Don't process blob responses (for file downloads)
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // Backend returns: { success: true, data: {...}, message: '...' }
    // Return the whole response.data to preserve the structure
    return response.data;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Handle other errors - return a proper error object
    const apiError: ApiError = {
      success: false,
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An error occurred',
      timestamp: error.response?.data?.timestamp || new Date().toISOString(),
      path: originalRequest?.url || '',
      errors: error.response?.data?.errors || null,
    };

    // Only log errors in development mode and exclude 401 (already handled above)
    // Disabled to reduce console noise
    // if (process.env.NODE_ENV === 'development' && apiError.statusCode !== 401) {
    //   console.error('API Error:', {
    //     url: originalRequest?.url,
    //     method: originalRequest?.method,
    //     status: apiError.statusCode,
    //     message: apiError.message,
    //   });
    // }

    return Promise.reject(apiError);
  }
);

export default axiosInstance;
