'use client';

import { Users, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface AttendanceQuickStatsProps {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  notCheckedOut: number;
  loading?: boolean;
}

export default function AttendanceQuickStats({
  totalEmployees,
  present,
  late,
  absent,
  notCheckedOut,
  loading = false
}: AttendanceQuickStatsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-32"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;
  const lateRate = totalEmployees > 0 ? Math.round((late / totalEmployees) * 100) : 0;

  const stats = [
    {
      label: 'Tổng nhân viên',
      value: totalEmployees,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Đã chấm công',
      value: present,
      percentage: attendanceRate,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Đi muộn',
      value: late,
      percentage: lateRate,
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      label: 'Vắng mặt',
      value: absent,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      label: 'Chưa checkout',
      value: notCheckedOut,
      icon: TrendingUp,
      color: 'amber',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <h3 className="text-lg font-bold text-slate-900">Tổng quan hôm nay</h3>
        <p className="text-sm text-slate-600 mt-1">Thống kê chấm công nhanh</p>
      </div>

      {/* Stats Grid */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border ${stat.borderColor} ${stat.bgColor} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <Icon size={18} className={stat.textColor} />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
                    {stat.percentage !== undefined && (
                      <span className="text-xs text-slate-500">({stat.percentage}%)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
