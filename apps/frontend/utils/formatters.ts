import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

// Date formatters
export const formatDate = (date: string | Date, pattern: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: vi });
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
};

// Currency formatters
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

// Percentage formatter
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

// Phone formatter
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Format: 0123 456 789
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

// ID Card formatter
export const formatIdCard = (idCard: string): string => {
  if (!idCard) return '';
  // Format: 001 234 567 890
  return idCard.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Work hours formatter
export const formatWorkHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// Month/Year formatter
export const formatMonthYear = (month: number, year: number): string => {
  return `Tháng ${month}/${year}`;
};
