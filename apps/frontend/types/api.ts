// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
  errors?: any;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: any;
  timestamp: string;
  path: string;
}
