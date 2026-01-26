export type PayrollStatus = 'DRAFT' | 'FINALIZED';

export interface Payroll {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  totalAmount: number;
  finalizedBy?: string;
  finalizedAt?: string;
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
  allowances: number;
  bonuses: number;
  overtimePay: number;
  deductions: number;
  socialInsurance: number;
  healthInsurance: number;
  unemploymentInsurance: number;
  taxableIncome: number;
  personalIncomeTax: number;
  netSalary: number;
  workDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  employee: {
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
  bonuses?: number;
  deductions?: number;
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
    bonuses: number;
    overtimePay: number;
    total: number;
  };
  deductions: {
    socialInsurance: number;
    healthInsurance: number;
    unemploymentInsurance: number;
    personalIncomeTax: number;
    other: number;
    total: number;
  };
  attendance: {
    workDays: number;
    paidLeaveDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
  };
  netSalary: number;
}
