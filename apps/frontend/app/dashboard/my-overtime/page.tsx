'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import overtimeService from '@/services/overtimeService';
import { Overtime } from '@/types/overtime';
import { useAuthStore } from '@/store/authStore';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-2 border-green-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-2 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-2 border-gray-200' },
};

export default function MyOvertimePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const stats = useMemo(() => {
    if (!Array.isArray(overtimes) || overtimes.length === 0) {
      return { total: 0, pending: 0, approved: 0, rejected: 0, totalHours: 0 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthData = overtimes.filter(o => {
      const overtimeDate = new Date(o.date);
      return overtimeDate.getMonth() === currentMonth &&
        overtimeDate.getFullYear() === currentYear;
    });

    const totalHours = currentMonthData
      .filter(o => o.status === 'APPROVED')
      .reduce((sum, o) => sum + (Number(o.hours) || 0), 0);

    return {
      total: overtimes.length,
      pending: overtimes.filter(o => o.status === 'PENDING').length,
      approved: overtimes.filter(o => o.status === 'APPROVED').length,
      rejected: overtimes.filter(o => o.status === 'REJECTED').length,
      totalHours,
    };
  }, [overtimes]);

  useEffect(() => {
    if (user) {
      fetchOvertimes();
    }
  }, [user?.employeeId]);

  const fetchOvertimes = async () => {
    try {
      setLoading(true);
      const response = await overtimeService.getMyRequests();
      const data = Array.isArray(response.data) ? response.data : [];
      setOvertimes(data);
    } catch (error) {
      console.error('Failed to fetch overtimes:', error);
      setOvertimes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOvertimes = Array.isArray(overtimes)
    ? (filter === 'all' ? overtimes : overtimes.filter(o => o.status === filter))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Làm thêm giờ</h1>
            <p className="text-slate-500 mt-1">Đăng ký và theo dõi đơn tăng ca của tôi</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/overtime/new')}
            className="flex items-center gap-2 px-6 py-3 bg-brandBlue text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Đăng ký tăng ca
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border-2 border-slate-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-brandBlue" size={20} />
              </div>
              <p className="text-sm text-slate-600">Tổng đơn</p>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-6 border-2 border-yellow-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Chờ duyệt</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border-2 border-green-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Đã duyệt</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-6 border-2 border-red-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Từ chối</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-brandBlue rounded-xl p-6 text-white border-2 border-brandBlue/20"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock size={20} />
              </div>
              <p className="text-sm text-white/80">Giờ đã duyệt</p>
            </div>
            <p className="text-3xl font-bold">
              {typeof stats.totalHours === 'number' ? stats.totalHours.toLocaleString('vi-VN') : '0'}h
            </p>
            <p className="text-xs text-white/60 mt-1">Tháng này</p>
          </motion.div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ duyệt' },
            { key: 'APPROVED', label: 'Đã duyệt' },
            { key: 'REJECTED', label: 'Từ chối' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key
                  ? 'bg-brandBlue text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Thời gian</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Số giờ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredOvertimes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {filter === 'all' ? 'Chưa có đơn tăng ca nào' : 'Không có đơn nào ở trạng thái này'}
                    </td>
                  </tr>
                ) : (
                  filteredOvertimes.map((overtime) => (
                    <motion.tr
                      key={overtime.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {new Date(overtime.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {new Date(overtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(overtime.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-brandBlue">{overtime.hours}h</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {overtime.reason}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${statusLabels[overtime.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[overtime.status]?.label || overtime.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => router.push(`/dashboard/overtime/${overtime.id}`)}
                          className="text-brandBlue hover:underline text-sm font-medium"
                        >
                          Chi tiết
                        </button>
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
