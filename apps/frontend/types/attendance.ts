export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  status: AttendanceStatus;
  note?: string;
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
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  totalWorkHours: number;
}

export interface AttendanceStatistics {
  totalRecords: number;
  lateCount: number;
  earlyLeaveCount: number;
  lateRate: number;
  earlyLeaveRate: number;
  avgWorkHours: number;
}

export interface CheckInData {
  employeeId: string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

export interface AttendanceReport {
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  totalWorkHours: number;
  avgWorkHours: number;
  byEmployee?: Array<{
    employee: any;
    presentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    totalWorkHours: number;
  }>;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  attendanceId?: string;
  date: string;
  originalCheckIn?: string;
  originalCheckOut?: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
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
    department: {
      id: string;
      name: string;
    };
  };
  attendance?: Attendance;
}

export interface CreateCorrectionData {
  date: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}
