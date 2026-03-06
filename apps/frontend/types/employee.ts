export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  dateOfBirth: string;
  gender?: Gender;
  idCard: string;
  address?: string;
  phone?: string;
  email: string;
  avatarUrl?: string;
  departmentId: string;
  position: string;
  startDate: string;
  endDate?: string;
  status: EmployeeStatus;
  baseSalary: number;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    code: string;
    name: string;
  };
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  _count?: {
    contracts: number;
    attendances: number;
    leaveRequests: number;
    rewards: number;
    disciplines: number;
  };
}

export interface CreateEmployeeData {
  fullName: string;
  dateOfBirth: string;
  gender?: Gender;
  idCard: string;
  address?: string;
  phone?: string;
  email: string;
  departmentId: string;
  position: string;
  startDate: string;
  baseSalary: number;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  status?: EmployeeStatus;
  endDate?: string;
}

export interface EmployeeStatistics {
  total: number;
  byStatus: Array<{ status: EmployeeStatus; count: number }>;
  byDepartment: Array<{ department: any; count: number }>;
  byGender: Array<{ gender: Gender; count: number }>;
  averageSalary: number;
}

export interface QueryEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  position?: string;
  status?: EmployeeStatus | string;
  gender?: Gender | string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
