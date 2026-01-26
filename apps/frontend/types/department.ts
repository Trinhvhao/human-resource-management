export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    code: string;
    name: string;
  };
  children?: Department[];
  manager?: {
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
  };
  employees?: Array<{
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    email: string;
  }>;
  _count?: {
    employees: number;
    children: number;
  };
}

export interface CreateDepartmentData {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {
  isActive?: boolean;
}

export interface DepartmentStatistics {
  total: number;
  byDepartment: Array<{
    department: Department;
    employeeCount: number;
  }>;
}
