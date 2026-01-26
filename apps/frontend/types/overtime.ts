export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Overtime {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: OvertimeStatus;
  approverId?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    baseSalary?: number;
    department?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateOvertimeData {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
}

export interface RejectOvertimeData {
  rejectedReason: string;
}

export interface OvertimeReport {
  month: number;
  year: number;
  totalRequests: number;
  totalHours: number;
  byStatus: Array<{ status: OvertimeStatus; count: number; hours: number }>;
  byEmployee: Array<{
    employee: any;
    totalHours: number;
    requestCount: number;
  }>;
}
