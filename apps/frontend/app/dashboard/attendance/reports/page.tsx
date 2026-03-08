'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Calendar, Users, Clock, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import attendanceService from '@/services/attendanceService';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/formatters';

export default function AttendanceReportsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const fetchReport = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      const [reportResponse, statsResponse, attendancesResponse] = await Promise.all([
        attendanceService.getMonthlyReport(month, year),
        attendanceService.getStatistics(month, year),
        attendanceService.getEmployeeAttendances(user.employeeId, month, year)
      ]);

      setReport({
        ...reportResponse.data,
        myAttendances: attendancesResponse.data.data,
        mySummary: attendancesResponse.data.summary
      });
      setStatistics(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
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

  const handleExport = () => {
    alert('Tính năng xuất Excel đang được phát triển');
  };

  return (
    <>
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
              <h1 className="text-3xl font-bold text-secondary">Báo cáo chấm công</h1>
              <p className="text-slate-500 mt-1">Báo cáo tổng hợp theo tháng</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Xuất Excel
          </button>
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

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tổng bản ghi</p>
                  <p className="text-2xl font-bold text-primary">{statistics.totalRecords}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tỷ lệ đi muộn</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.lateRate}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Tỷ lệ về sớm</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.earlyLeaveRate}%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Giờ TB/ngày</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.avgWorkHours}h</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* My Summary */}
        {report?.mySummary && (
          <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6">Tổng hợp của tôi</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Tổng ngày</p>
                <p className="text-3xl font-bold">{report.mySummary.totalDays}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Ngày công</p>
                <p className="text-3xl font-bold">{report.mySummary.presentDays}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Đi muộn</p>
                <p className="text-3xl font-bold">{report.mySummary.lateDays}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Về sớm</p>
                <p className="text-3xl font-bold">{report.mySummary.earlyLeaveDays}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-1">Tổng giờ</p>
                <p className="text-3xl font-bold">{report.mySummary.totalWorkHours?.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        )}

        {/* Company-wide Report (for HR/Admin) */}
        {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && report && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-primary">Báo cáo toàn công ty</h3>
              <p className="text-sm text-slate-500 mt-1">Tổng hợp chấm công theo nhân viên</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phòng ban</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ngày công</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Đi muộn</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Về sớm</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tổng giờ</th>
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
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                      </tr>
                    ))
                  ) : report.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    report.data?.map((item: any, index: number) => (
                      <motion.tr
                        key={item.employee.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-primary">{item.employee.fullName}</p>
                            <p className="text-sm text-slate-500">{item.employee.employeeCode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {item.employee.department?.name || '--'}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-primary">
                          {item.summary.present}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-yellow-600">
                          {item.summary.late}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-blue-600">
                          {item.summary.earlyLeave}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-green-600">
                          {item.summary.totalHours?.toFixed(1)}h
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
