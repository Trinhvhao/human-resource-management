export type PayrollStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'LOCKED';

export interface Payroll {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalAmount: number;
  finalizedBy?: string;
  finalizedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  lockedAt?: string;
  lockedBy?: string;
  version?: number;
  previousVersionId?: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  items: PayrollItem[];
  _count?: {
    items: number;
  };
}

export interface PayrollItem {
  id: string;
  payrollId: string;
  employeeId: string;
  baseSalary: number;
  workDays: number;
  actualWorkDays: number;
  allowances: number;
  bonus: number;
  deduction: number;
  overtimeHours: number;
  overtimePay: number;
  insurance: number; // Total insurance (BHXH + BHYT + BHTN)
  tax: number; // Personal income tax
  netSalary: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    position: string;
    department: {
      id: string;
      name: string;
    };
  };
}

export interface CreatePayrollData {
  month: number;
  year: number;
}

export interface UpdatePayrollItemData {
  allowances?: number;
  bonus?: number;
  deduction?: number;
  overtimeHours?: number;
  notes?: string;
}

export interface Payslip {
  employee: {
    employeeCode: string;
    fullName: string;
    position: string;
    department: string;
  };
  period: {
    month: number;
    year: number;
  };
  earnings: {
    baseSalary: number;
    allowances: number;
    bonus: number;
    overtimePay: number;
    total: number;
  };
  deductions: {
    insurance: number; // Total insurance (BHXH + BHYT + BHTN)
    tax: number; // Personal income tax
    other: number; // Other deductions
    total: number;
  };
  attendance: {
    workDays: number;
    actualWorkDays: number;
    overtimeHours: number;
  };
  netSalary: number;
}
