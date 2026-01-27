'use client';

import React, { useEffect, useState } from 'react';
import { Users, Clock, Calendar, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import dashboardService from '@/services/dashboardService';

interface CardData {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function OverviewCards() {
  const [data, setData] = useState<CardData[]>([
    {
      title: 'Tổng nhân viên',
      value: '...',
      change: 0,
      icon: Users,
      color: 'text-brandBlue',
      bgColor: 'bg-brandBlue/10',
    },
    {
      title: 'Đang làm việc',
      value: '...',
      change: 0,
      icon: Clock,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: 'Đơn chờ duyệt',
      value: '...',
      change: 0,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Hợp đồng sắp hết hạn',
      value: '...',
      change: 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getOverview();
      
      // Axios interceptor returns response.data directly, so response = { success: true, data: {...} }
      const overviewData = response.data;

      if (!overviewData) {
        console.error('No overview data received');
        return;
      }

      const totalEmployees = overviewData.employees?.total || 0;
      const activeEmployees = overviewData.employees?.active || 0;
      const pendingLeaveRequests = overviewData.leaveRequests?.pending || 0;
      const pendingOvertimeRequests = overviewData.overtimeRequests?.pending || 0;
      const totalPendingRequests = pendingLeaveRequests + pendingOvertimeRequests;
      const expiringContracts = overviewData.contracts?.expiringSoon || 0;
      const attendanceRate = overviewData.attendance?.rate || 0;

      setData([
        {
          title: 'Tổng nhân viên',
          value: totalEmployees.toString(),
          change: attendanceRate,
          icon: Users,
          color: 'text-brandBlue',
          bgColor: 'bg-brandBlue/10',
        },
        {
          title: 'Đang làm việc',
          value: `${activeEmployees}/${totalEmployees}`,
          change: totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0,
          icon: Clock,
          color: 'text-secondary',
          bgColor: 'bg-secondary/10',
        },
        {
          title: 'Đơn chờ duyệt',
          value: totalPendingRequests.toString(),
          change: totalPendingRequests,
          icon: Calendar,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'HĐ sắp hết hạn',
          value: expiringContracts.toString(),
          change: expiringContracts > 0 ? -expiringContracts : 0,
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch overview:', error);
      // Keep default loading values on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {data.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change >= 0;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-shadow"
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mb-4`}>
              <Icon className={card.color} size={24} />
            </div>

            {/* Title */}
            <p className="text-slate-500 text-sm mb-1">{card.title}</p>

            {/* Value */}
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-primary">{card.value}</h3>

              {/* Change Badge */}
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{Math.abs(card.change)}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
