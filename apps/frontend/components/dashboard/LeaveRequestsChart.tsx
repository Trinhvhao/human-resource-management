'use client';

import React, { useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import axiosInstance from '@/lib/axios';

const LeaveRequestsChart = memo(function LeaveRequestsChart() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveStats();
  }, []);

  const fetchLeaveStats = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Fetch all leave requests for the current month (large limit to avoid pagination cutoff)
      const response = await axiosInstance.get('/leave-requests', {
        params: { limit: 1000, page: 1 },
      });

      if (response.data) {
        const requests: any[] = Array.isArray(response.data) ? response.data : [];

        // Filter by current month using createdAt
        const currentMonthRequests = requests.filter((req: any) => {
          const reqDate = new Date(req.createdAt);
          return reqDate.getMonth() + 1 === currentMonth && reqDate.getFullYear() === currentYear;
        });

        const pending = currentMonthRequests.filter((req: any) => req.status === 'PENDING').length;
        const approved = currentMonthRequests.filter((req: any) => req.status === 'APPROVED').length;
        const rejected = currentMonthRequests.filter((req: any) => req.status === 'REJECTED').length;

        setStats({
          pending,
          approved,
          rejected,
          total: currentMonthRequests.length,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch leave stats:', error?.message);
      setStats({ pending: 0, approved: 0, rejected: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const items = [
    {
      label: 'Chờ duyệt',
      value: stats.pending,
      color: 'bg-secondary',
      icon: Clock,
      iconColor: 'text-secondary',
      percentage: stats.total > 0 ? (stats.pending / stats.total) * 100 : 0,
    },
    {
      label: 'Đã duyệt',
      value: stats.approved,
      color: 'bg-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      percentage: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
    },
    {
      label: 'Từ chối',
      value: stats.rejected,
      color: 'bg-red-500',
      icon: XCircle,
      iconColor: 'text-red-600',
      percentage: stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Đơn nghỉ phép</h3>
          <p className="text-sm text-slate-500 mt-1">Tháng này</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
          <Calendar className="text-purple-600" size={20} />
          <span className="text-sm font-bold text-purple-600">{stats.total}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Label and Value */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={item.iconColor} size={18} />
                  <span className="text-sm font-medium text-slate-600">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{item.value}</span>
                  <span className="text-xs text-slate-400">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Tỷ lệ chấp thuận</span>
          <span className="text-lg font-bold text-green-600">
            {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
});

export default LeaveRequestsChart;
