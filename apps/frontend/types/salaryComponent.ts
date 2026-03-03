export type ComponentType =
  | 'BASIC'      // Lương cơ bản
  | 'ALLOWANCE'  // Phụ cấp (generic)
  | 'LUNCH'      // Phụ cấp ăn trưa
  | 'TRANSPORT'  // Phụ cấp xăng xe
  | 'PHONE'      // Phụ cấp điện thoại
  | 'HOUSING'    // Phụ cấp nhà ở
  | 'POSITION'   // Phụ cấp chức vụ
  | 'BONUS'      // Thưởng
  | 'OTHER';     // Khác

export interface SalaryComponent {
  id: string;
  employeeId: string;
  componentType: ComponentType;
  amount: number;
  effectiveDate: string;
  isActive: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    department?: {
      name: string;
    };
  };
}

export interface CreateSalaryComponentData {
  employeeId: string;
  componentType: ComponentType;
  amount: number;
  effectiveDate?: string;
  note?: string;
}

export interface UpdateSalaryComponentData {
  componentType?: ComponentType;
  amount?: number;
  effectiveDate?: string;
  isActive?: boolean;
  note?: string;
}

export interface EmployeeSalaryStructure {
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
  };
  components: SalaryComponent[];
  totalSalary: number;
}
