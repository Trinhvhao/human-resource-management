export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: {
      name: string;
    };
  };
  approver?: {
    id: string;
    email: string;
  };
}

export interface CreateLeaveRequestData {
  employeeId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  annualLeave: number;
  usedAnnual: number;
  sickLeave: number;
  usedSick: number;
  carriedOver: number;
  remainingAnnual?: number;
  remainingSick?: number;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    department?: {
      name: string;
    };
  };
}
