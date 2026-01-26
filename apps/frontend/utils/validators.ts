import { z } from 'zod';

// Email validator
export const emailSchema = z.string().email('Email không hợp lệ');

// Password validator
export const passwordSchema = z
  .string()
  .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số');

// Phone validator (Vietnam)
export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9}$/, 'Số điện thoại không hợp lệ');

// ID Card validator (Vietnam CCCD 12 digits)
export const idCardSchema = z
  .string()
  .regex(/^[0-9]{12}$/, 'CCCD phải có 12 chữ số');

// Date validators
export const dateSchema = z.string().refine((date) => {
  return !isNaN(Date.parse(date));
}, 'Ngày không hợp lệ');

export const futureDateSchema = z.string().refine((date) => {
  return new Date(date) > new Date();
}, 'Ngày phải sau ngày hiện tại');

export const pastDateSchema = z.string().refine((date) => {
  return new Date(date) < new Date();
}, 'Ngày phải trước ngày hiện tại');

// Age validator (18+)
export const dateOfBirthSchema = z.string().refine((date) => {
  const age = new Date().getFullYear() - new Date(date).getFullYear();
  return age >= 18;
}, 'Nhân viên phải từ 18 tuổi trở lên');

// Salary validator
export const salarySchema = z
  .number()
  .min(0, 'Lương phải lớn hơn 0')
  .max(1000000000, 'Lương không hợp lệ');

// Work hours validator
export const workHoursSchema = z
  .number()
  .min(0, 'Giờ làm không hợp lệ')
  .max(24, 'Giờ làm không được vượt quá 24h');

// Overtime hours validator
export const overtimeHoursSchema = z
  .number()
  .min(0.5, 'Tăng ca tối thiểu 0.5 giờ')
  .max(12, 'Tăng ca không được vượt quá 12 giờ/ngày');

// Leave days validator
export const leaveDaysSchema = z
  .number()
  .min(0.5, 'Nghỉ phép tối thiểu 0.5 ngày')
  .max(30, 'Nghỉ phép không được vượt quá 30 ngày');

// Date range validator
export const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
}).refine((data) => {
  return new Date(data.endDate) >= new Date(data.startDate);
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['endDate'],
});

// Time range validator
export const timeRangeSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
}).refine((data) => {
  const start = new Date(`2000-01-01 ${data.startTime}`);
  const end = new Date(`2000-01-01 ${data.endTime}`);
  return end > start;
}, {
  message: 'Giờ kết thúc phải sau giờ bắt đầu',
  path: ['endTime'],
});

// Helper functions
export const isValidEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const isValidPhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const isValidIdCard = (idCard: string): boolean => {
  return idCardSchema.safeParse(idCard).success;
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const calculateWorkDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};
