'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  FileText,
  DollarSign,
  Bell,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  ScanFace,
  User,
  RefreshCw,
} from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/common/Avatar';
import LiveClock from '@/components/common/LiveClock';

interface AttendanceToday {
  id?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: string;
  isLate?: boolean;
  hoursWorked?: number;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  totalDays: number;
}

interface OvertimeRequest {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  hours: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState<AttendanceToday | null>(null);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [recentOvertime, setRecentOvertime] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const employee = user?.employee;
  const employeeId = employee?.id || user?.employeeId;

  // Fetch all data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, leavesRes, overtimeRes] = await Promise.all([
        axiosInstance.get('/attendances/today').catch(() => ({ data: null })),
        axiosInstance.get('/leave-requests/my-requests').catch(() => ({ data: [] })),
        axiosInstance.get('/overtime/my-requests').catch(() => ({ data: [] })),
      ]);

      // Today's attendance
      if (attendanceRes.data) {
        const att = attendanceRes.data.data || attendanceRes.data;
        setAttendance(att);
      }

      // Recent leaves (last 5)
      const leaves = Array.isArray(leavesRes.data) ? leavesRes.data : (leavesRes.data?.data || []);
      setRecentLeaves(leaves.slice(0, 5));

      // Recent overtime (last 5)
      const overtime = Array.isArray(overtimeRes.data) ? overtimeRes.data : (overtimeRes.data?.data || []);
      setRecentOvertime(overtime.slice(0, 5));
    } catch (error) {
      console.error('Failed to load employee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check in handler
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await axiosInstance.post('/attendances/check-in');
      setAttendance(res.data?.data || res.data);
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Chấm công vào thất bại');
    } finally {
      setCheckingIn(false);
    }
  };

  // Check out handler
  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const res = await axiosInstance.post('/attendances/check-out');
      setAttendance(res.data?.data || res.data);
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Chấm công ra thất bại');
    } finally {
      setCheckingOut(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-500',
    };
    const labels: Record<string, string> = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const pendingLeaves = recentLeaves.filter(l => l.status === 'PENDING').length;
  const pendingOvertime = recentOvertime.filter(o => o.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Welcome & Clock */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-r from-brandBlue to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={employee?.avatarUrl}
              name={employee?.fullName}
              size="xl"
              className="border-2 border-white/30"
            />
            <div>
              <h1 className="text-2xl font-bold">
                Xin chào, {employee?.fullName || user?.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-blue-100 mt-1">
                {employee?.position || 'Nhân viên'} • {employee?.department?.name || 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <LiveClock className="text-4xl font-bold font-mono tabular-nums" />
          </div>
        </div>
      </motion.div>

      {/* Attendance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock size={20} className="text-brandBlue" />
            Chấm công hôm nay
          </h2>
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Check In */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <LogIn size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Giờ vào</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatTime(attendance?.checkInTime)}
            </p>
            {attendance?.isLate && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Đi trễ
              </p>
            )}
          </div>

          {/* Check Out */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <LogOut size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Giờ ra</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatTime(attendance?.checkOutTime)}
            </p>
            {attendance?.hoursWorked != null && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Timer size={12} /> {attendance.hoursWorked.toFixed(1)}h làm việc
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 justify-center">
            {!attendance?.checkInTime ? (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <LogIn size={18} />
                {checkingIn ? 'Đang chấm công...' : 'Chấm công vào'}
              </button>
            ) : !attendance?.checkOutTime ? (
              <button
                onClick={handleCheckOut}
                disabled={checkingOut}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                <LogOut size={18} />
                {checkingOut ? 'Đang chấm công...' : 'Chấm công ra'}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium">
                <CheckCircle2 size={18} className="text-green-500" />
                Đã hoàn thành
              </div>
            )}
            <button
              onClick={() => router.push('/dashboard/face-recognition')}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              <ScanFace size={16} />
              Chấm công khuôn mặt
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Đơn nghỉ phép chờ duyệt',
            value: pendingLeaves,
            icon: Calendar,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            onClick: () => router.push('/dashboard/my-leaves'),
          },
          {
            label: 'Đơn OT chờ duyệt',
            value: pendingOvertime,
            icon: FileText,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-100',
            onClick: () => router.push('/dashboard/my-overtime'),
          },
          {
            label: 'Tổng đơn nghỉ phép',
            value: recentLeaves.length,
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            onClick: () => router.push('/dashboard/my-leaves'),
          },
          {
            label: 'Tổng đơn OT',
            value: recentOvertime.length,
            icon: FileText,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            onClick: () => router.push('/dashboard/my-overtime'),
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              onClick={stat.onClick}
              className={`${stat.bg} ${stat.border} border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all`}
            >
              <Icon size={20} className={stat.color} />
              <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Requests Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              Đơn nghỉ phép gần đây
            </h3>
            <button
              onClick={() => router.push('/dashboard/my-leaves')}
              className="text-sm text-brandBlue hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Chưa có đơn nghỉ phép nào</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{leave.type}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(leave.startDate).toLocaleDateString('vi-VN')} - {new Date(leave.endDate).toLocaleDateString('vi-VN')} ({leave.totalDays} ngày)
                    </p>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Overtime Requests */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-purple-500" />
              Đơn tăng ca gần đây
            </h3>
            <button
              onClick={() => router.push('/dashboard/my-overtime')}
              className="text-sm text-brandBlue hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>
          {recentOvertime.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Chưa có đơn tăng ca nào</p>
          ) : (
            <div className="space-y-3">
              {recentOvertime.map(ot => (
                <div key={ot.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(ot.date).toLocaleDateString('vi-VN')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ot.startTime} - {ot.endTime} ({ot.hours}h)
                    </p>
                  </div>
                  {getStatusBadge(ot.status)}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="font-bold text-slate-900 mb-4">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Chấm công', icon: Clock, href: '/dashboard/my-attendance', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Nghỉ phép', icon: Calendar, href: '/dashboard/my-leaves', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Tăng ca', icon: FileText, href: '/dashboard/my-overtime', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Lương', icon: DollarSign, href: '/dashboard/payroll', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Lịch của tôi', icon: Calendar, href: '/dashboard/my-calendar', color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Nhận diện mặt', icon: ScanFace, href: '/dashboard/face-recognition', color: 'text-pink-600', bg: 'bg-pink-50' },
            { label: 'Hồ sơ', icon: User, href: '/dashboard/profile', color: 'text-teal-600', bg: 'bg-teal-50' },
            { label: 'Cài đặt', icon: Bell, href: '/dashboard/settings', color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`${item.bg} rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all border border-transparent hover:border-slate-200`}
              >
                <Icon size={24} className={item.color} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
