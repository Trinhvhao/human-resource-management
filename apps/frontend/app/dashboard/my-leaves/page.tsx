'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import leaveService from '@/services/leaveService';
import { useAuthStore } from '@/store/authStore';
import { LeaveRequest, LeaveBalance } from '@/types/leave';
import { formatDate } from '@/utils/formatters';

export default function MyLeavesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      const [balanceRes, requestsRes] = await Promise.all([
        leaveService.getBalance(user.employeeId).catch(() => ({ data: null })),
        leaveService.getMyRequests(),
      ]);

      setBalance(balanceRes.data);
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-700 border-green-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    const icons: Record<string, React.ComponentType<{ size?: number }>> = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
    };
    const labels: Record<string, string> = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    };
    const Icon = icons[status] || AlertCircle;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 whitespace-nowrap ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        <Icon size={14} />
        {labels[status] || status}
      </span>
    );
  };

  const leaveTypeLabels: Record<string, string> = {
    ANNUAL: 'Phép năm',
    SICK: 'Phép bệnh',
    UNPAID: 'Không lương',
    MATERNITY: 'Thai sản',
    PATERNITY: 'Cha',
    BEREAVEMENT: 'Tang',
  };

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Nghỉ phép của tôi</h1>
            <p className="text-slate-500 mt-1">Quản lý đơn nghỉ phép và số dư phép năm</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/leaves/new')}
            className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Tạo đơn mới
          </button>
        </div>

        {/* Leave Balance Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                <div className="h-20 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : balance ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Annual Leave */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brandBlue rounded-2xl p-6 text-white relative overflow-hidden border-2 border-brandBlue/20"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar size={24} />
                  </div>
                  <p className="text-white/80 text-sm">Phép năm</p>
                </div>
                <p className="text-4xl font-bold">
                  {balance.remainingAnnual ?? (balance.annualLeave + balance.carriedOver - balance.usedAnnual)}
                </p>
                <p className="text-white/70 text-sm mt-2">
                  Còn lại / {balance.annualLeave + balance.carriedOver} ngày
                </p>
              </div>
            </motion.div>

            {/* Sick Leave */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border-2 border-brandBlue/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
                <p className="text-slate-600 text-sm">Phép bệnh</p>
              </div>
              <p className="text-4xl font-bold text-primary">
                {balance.remainingSick ?? (balance.sickLeave - balance.usedSick)}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Còn lại / {balance.sickLeave} ngày
              </p>
            </motion.div>

            {/* Carried Over */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border-2 border-secondary/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Calendar className="text-secondary" size={24} />
                </div>
                <p className="text-slate-600 text-sm">Phép cộng dồn</p>
              </div>
              <p className="text-4xl font-bold text-primary">{balance.carriedOver || 0}</p>
              <p className="text-slate-500 text-sm mt-2">Từ năm trước</p>
            </motion.div>
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tổng đơn', value: stats.total, color: 'blue' },
            { label: 'Chờ duyệt', value: stats.pending, color: 'yellow' },
            { label: 'Đã duyệt', value: stats.approved, color: 'green' },
            { label: 'Từ chối', value: stats.rejected, color: 'red' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white rounded-xl p-4 border border-slate-200"
            >
              <p className="text-sm text-slate-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
            </motion.div>
          ))}
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

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-primary">Đơn nghỉ phép của tôi</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Loại phép</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Từ ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Đến ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Số ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-10"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                    </tr>
                  ))
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      {filter === 'all' ? 'Chưa có đơn nghỉ phép nào' : 'Không có đơn nào ở trạng thái này'}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-primary">
                          {leaveTypeLabels[request.leaveType] || request.leaveType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.startDate)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.endDate)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-brandBlue">{request.totalDays}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-1 max-w-xs">{request.reason}</p>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
