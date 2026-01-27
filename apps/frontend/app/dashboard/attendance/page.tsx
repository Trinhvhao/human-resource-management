'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Clock, Calendar, TrendingUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import attendanceService from '@/services/attendanceService';
import { useAuthStore } from '@/store/authStore';
import { formatTime, formatDate } from '@/utils/formatters';

interface TodayAttendance {
  id?: string;
  checkIn?: string;
  checkOut?: string;
  workHours?: number;
  isLate?: boolean;
  isEarlyLeave?: boolean;
  status: string;
}

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayAttendance();
    fetchStatistics();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      const response = await attendanceService.getTodayAttendance();
      setTodayAttendance(response.data || { status: 'NOT_CHECKED_IN' });
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setTodayAttendance({ status: 'NOT_CHECKED_IN' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!user?.employeeId) return;

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const [statsResponse, attendancesResponse] = await Promise.all([
        attendanceService.getStatistics(month, year),
        attendanceService.getEmployeeAttendances(user.employeeId, month, year)
      ]);

      setStatistics({
        ...statsResponse.data,
        employeeSummary: attendancesResponse.data.summary
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user?.employeeId) return;

    try {
      setChecking(true);
      await attendanceService.checkIn();
      await fetchTodayAttendance();
    } catch (error: any) {
      console.error('Check-in failed:', error);
      alert(error.response?.data?.message || 'Check-in thất bại');
    } finally {
      setChecking(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.employeeId) return;

    try {
      setChecking(true);
      await attendanceService.checkOut();
      await fetchTodayAttendance();
    } catch (error: any) {
      console.error('Check-out failed:', error);
      alert(error.response?.data?.message || 'Check-out thất bại');
    } finally {
      setChecking(false);
    }
  };

  const isCheckedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isCheckedOut = todayAttendance?.checkIn && todayAttendance?.checkOut;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary">Chấm công</h1>
          <p className="text-slate-500 mt-1">Quản lý chấm công và theo dõi giờ làm việc</p>
        </div>

        {/* Main Check-in/out Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-brandBlue via-[#0047b3] to-[#003080] rounded-2xl p-8 text-white relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-white/70 text-sm">Hôm nay</p>
                <h2 className="text-2xl font-bold mt-1">{formatDate(new Date())}</h2>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Thời gian hiện tại</p>
                <h2 className="text-3xl font-bold mt-1 font-mono">
                  {currentTime.toLocaleTimeString('vi-VN')}
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-white/70">Đang tải...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Check-in Status */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Check-in</p>
                      <p className="text-xl font-bold">
                        {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}
                      </p>
                    </div>
                  </div>
                  {todayAttendance?.isLate && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-200 px-2 py-1 rounded-full">
                      <AlertCircle size={12} />
                      Đi muộn
                    </span>
                  )}
                </div>

                {/* Check-out Status */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Check-out</p>
                      <p className="text-xl font-bold">
                        {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}
                      </p>
                    </div>
                  </div>
                  {todayAttendance?.isEarlyLeave && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-200 px-2 py-1 rounded-full">
                      <AlertCircle size={12} />
                      Về sớm
                    </span>
                  )}
                </div>

                {/* Work Hours */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Giờ làm việc</p>
                      <p className="text-xl font-bold">
                        {todayAttendance?.workHours ? Number(todayAttendance.workHours).toFixed(1) : '0.0'} giờ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              {!isCheckedIn && !isCheckedOut && (
                <button
                  onClick={handleCheckIn}
                  disabled={checking}
                  className="flex-1 bg-white text-brandBlue px-6 py-4 rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Check-in
                    </>
                  )}
                </button>
              )}

              {isCheckedIn && (
                <button
                  onClick={handleCheckOut}
                  disabled={checking}
                  className="flex-1 bg-secondary hover:bg-secondary/90 px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      Check-out
                    </>
                  )}
                </button>
              )}

              {isCheckedOut && (
                <div className="flex-1 bg-green-500 px-6 py-4 rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Đã hoàn thành
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statistics ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-blue-600" size={20} />
                  </div>
                  <p className="text-sm text-slate-600">Tháng này</p>
                </div>
                <p className="text-2xl font-bold text-primary">{statistics.employeeSummary?.presentDays || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Ngày công</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="text-red-600" size={20} />
                  </div>
                  <p className="text-sm text-slate-600">Đi muộn</p>
                </div>
                <p className="text-2xl font-bold text-primary">{statistics.employeeSummary?.lateDays || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Lần</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600" size={20} />
                  </div>
                  <p className="text-sm text-slate-600">Về sớm</p>
                </div>
                <p className="text-2xl font-bold text-primary">{statistics.employeeSummary?.earlyLeaveDays || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Lần</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <p className="text-sm text-slate-600">Tỷ lệ</p>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {statistics.employeeSummary?.presentDays && statistics.employeeSummary?.totalDays
                    ? Math.round((statistics.employeeSummary.presentDays / statistics.employeeSummary.totalDays) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">Chấm công đúng giờ</p>
              </motion.div>
            </>
          ) : (
            [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-slate-200">
                <div className="h-10 bg-slate-100 rounded mb-2"></div>
                <div className="h-8 bg-slate-100 rounded mb-1"></div>
                <div className="h-4 bg-slate-100 rounded"></div>
              </div>
            ))
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/dashboard/attendance/history')}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brandBlue hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-primary mb-1">Lịch sử chấm công</h3>
            <p className="text-sm text-slate-500">Xem lịch sử và báo cáo chi tiết</p>
          </button>
          <button 
            onClick={() => router.push('/dashboard/attendance/corrections')}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brandBlue hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-primary mb-1">Điều chỉnh chấm công</h3>
            <p className="text-sm text-slate-500">Yêu cầu điều chỉnh giờ check-in/out</p>
          </button>
          <button 
            onClick={() => router.push('/dashboard/attendance/reports')}
            className="bg-white rounded-xl p-4 border border-slate-200 hover:border-brandBlue hover:shadow-md transition-all text-left"
          >
            <h3 className="font-semibold text-primary mb-1">Báo cáo tháng</h3>
            <p className="text-sm text-slate-500">Xuất báo cáo chấm công</p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
