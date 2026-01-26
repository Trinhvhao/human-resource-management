export type UserRole = 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId?: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    avatarUrl?: string;
    department: {
      id: string;
      name: string;
    };
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  employeeId?: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

// Form data for change password (includes confirmPassword for frontend validation)
export interface ChangePasswordFormData extends ChangePasswordData {
  confirmPassword: string;
}
