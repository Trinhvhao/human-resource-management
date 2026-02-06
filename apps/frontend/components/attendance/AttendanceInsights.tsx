'use client';

import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface AttendanceInsightsProps {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  notCheckedOut: number;
}

export default function AttendanceInsights({
  totalEmployees,
  present,
  late,
  absent,
  notCheckedOut,
}: AttendanceInsightsProps) {
  const attendanceRate = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0;
  const lateRate = present > 0 ? Math.round((late / present) * 100) : 0;
  const notCheckedIn = totalEmployees - present - absent;

  const insights = [];

  // Not checked in yet
  if (notCheckedIn > 0) {
    insights.push({
      type: 'warning',
      icon: AlertCircle,
      message: `${notCheckedIn} nhân viên chưa check-in`,
      color: 'orange',
    });
  }

  // Late rate
  if (lateRate > 20) {
    insights.push({
      type: 'alert',
      icon: TrendingUp,
      message: `Tỷ lệ đi muộn cao: ${lateRate}%`,
      color: 'red',
    });
  } else if (lateRate > 0) {
    insights.push({
      type: 'info',
      icon: Clock,
      message: `${late} nhân viên đi muộn hôm nay`,
      color: 'orange',
    });
  }

  // Not checked out
  if (notCheckedOut > 0) {
    insights.push({
      type: 'info',
      icon: AlertCircle,
      message: `${notCheckedOut} nhân viên chưa check-out`,
      color: 'blue',
    });
  }

  // Good attendance
  if (attendanceRate >= 95 && lateRate < 10) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      message: 'Chấm công tốt hôm nay!',
      color: 'emerald',
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-brandBlue" />
        Thông tin chi tiết
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const colorClasses = {
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            orange: 'bg-orange-50 border-orange-200 text-orange-700',
            red: 'bg-red-50 border-red-200 text-red-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
          };

          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border ${colorClasses[insight.color as keyof typeof colorClasses]}`}
            >
              <Icon size={18} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{insight.message}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-600 mb-1">Tỷ lệ có mặt</p>
          <p className="text-lg font-bold text-slate-900">{attendanceRate}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 mb-1">Tỷ lệ đi muộn</p>
          <p className="text-lg font-bold text-slate-900">{lateRate}%</p>
        </div>
      </div>
    </div>
  );
}
