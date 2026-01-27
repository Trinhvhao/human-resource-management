'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import attendanceService from '@/services/attendanceService';
import { useAuthStore } from '@/store/authStore';
import { Attendance } from '@/types/attendance';
import { formatTime, formatDate } from '@/utils/formatters';

export default function AttendanceHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchAttendances();
  }, [month, year]);

  const fetchAttendances = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      const response = await attendanceService.getEmployeeAttendances(user.employeeId, month, year);
      setAttendances(response.data.data);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getStatusBadge = (attendance: Attendance) => {
    if (!attendance.checkIn) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Vắng</span>;
    }
    if (attendance.isLate && attendance.isEarlyLeave) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Muộn & Sớm</span>;
    }
    if (attendance.isLate) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Đi muộn</span>;
    }
    if (attendance.isEarlyLeave) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Về sớm</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Đúng giờ</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-secondary">Lịch sử chấm công</h1>
              <p className="text-slate-500 mt-1">Xem chi tiết chấm công theo tháng</p>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary">
                Tháng {month}/{year}
              </h2>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Tổng ngày</p>
              <p className="text-2xl font-bold text-primary">{summary.totalDays}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Ngày công</p>
              <p className="text-2xl font-bold text-green-600">{summary.presentDays}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Đi muộn</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.lateDays}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Về sớm</p>
              <p className="text-2xl font-bold text-blue-600">{summary.earlyLeaveDays}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-600 mb-1">Tổng giờ</p>
              <p className="text-2xl font-bold text-primary">{summary.totalWorkHours?.toFixed(1)}h</p>
            </div>
          </div>
        )}

        {/* Attendance List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Giờ làm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Không có dữ liệu chấm công
                    </td>
                  </tr>
                ) : (
                  attendances.map((attendance, index) => (
                    <motion.tr
                      key={attendance.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {formatDate(attendance.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {attendance.checkIn ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            {formatTime(attendance.checkIn)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-red-600" />
                            --:--
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {attendance.checkOut ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-600" />
                            {formatTime(attendance.checkOut)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-slate-400" />
                            --:--
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {attendance.workHours ? `${attendance.workHours.toFixed(1)}h` : '--'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(attendance)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {attendance.note || '--'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
