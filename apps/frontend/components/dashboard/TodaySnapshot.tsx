'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, FileText, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface SnapshotData {
  workingNow: number;
  lateToday: number;
  pendingApprovals: number;
  expiringContracts: number;
  lastUpdated: string;
}

export default function TodaySnapshot() {
  const router = useRouter();
  const [data, setData] = useState<SnapshotData>({
    workingNow: 0,
    lateToday: 0,
    pendingApprovals: 0,
    expiringContracts: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSnapshot();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSnapshot, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSnapshot = async () => {
    try {
      // Use single optimized endpoint instead of multiple API calls
      const response: any = await axiosInstance.get('/dashboard/today-snapshot');

      if (response?.success && response?.data) {
        setData({
          workingNow: response.data.workingNow || 0,
          lateToday: response.data.lateToday || 0,
          pendingApprovals: response.data.pendingApprovals || 0,
          expiringContracts: response.data.expiringContracts || 0,
          lastUpdated: response.data.lastUpdated || new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch snapshot:', {
        message: error?.message,
        statusCode: error?.statusCode,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const cards = [
    {
      label: 'Đang làm việc',
      value: data.workingNow,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      link: '/dashboard/attendance',
      description: 'Đã check-in',
    },
    {
      label: 'Đi muộn hôm nay',
      value: data.lateToday,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      link: '/dashboard/attendance?status=late',
      description: 'Cần theo dõi',
      urgent: data.lateToday > 5,
    },
    {
      label: 'Chờ duyệt',
      value: data.pendingApprovals,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      link: '/dashboard/leaves?status=pending',
      description: 'Đơn từ',
      urgent: data.pendingApprovals > 10,
    },
    {
      label: 'HĐ hết hạn 7 ngày',
      value: data.expiringContracts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      link: '/dashboard/employees?filter=expiring-contracts',
      description: 'Cần gia hạn',
      urgent: data.expiringContracts > 0,
    },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tình hình hôm nay</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Cập nhật lúc {formatTime(data.lastUpdated)}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSnapshot}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Làm mới"
        >
          <TrendingUp size={18} className="text-blue-600" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => router.push(card.link)}
              className={`
                relative p-4 rounded-xl border-2 ${card.borderColor} ${card.bgColor}
                hover:shadow-xl hover:scale-105 transition-all cursor-pointer group
                ${card.urgent ? 'ring-2 ring-red-400 ring-offset-2' : ''}
              `}
            >
              {/* Urgent Badge */}
              {card.urgent && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={card.color} size={24} />
              </div>

              {/* Value */}
              <div className="mb-2">
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.description}</p>
              </div>

              {/* Label */}
              <p className="text-sm font-semibold text-slate-700">
                {card.label}
              </p>

              {/* Hover Arrow */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className={card.color} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" />
                </svg>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
