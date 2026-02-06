'use client';

import { Clock, TrendingUp } from 'lucide-react';
import { Attendance } from '@/types/attendance';
import { formatTime } from '@/utils/formatters';

interface AttendanceLiveFeedProps {
  recentCheckIns: Attendance[];
  loading?: boolean;
}

export default function AttendanceLiveFeed({ recentCheckIns, loading = false }: AttendanceLiveFeedProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-slate-900">Check-in gần đây</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-24"></div>
                <div className="h-2 bg-slate-100 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-slate-900">Check-in gần đây</h3>
        </div>
        <span className="text-xs text-slate-500">{recentCheckIns.length} nhân viên</span>
      </div>

      {/* Feed List */}
      <div className="p-5">
        <div className="space-y-3 max-h-[380px] overflow-y-auto">
          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-sm text-slate-500">Chưa có check-in nào</p>
            </div>
          ) : (
            recentCheckIns.map((attendance, index) => (
              <div
                key={attendance.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 bg-brandBlue rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {attendance.employee?.fullName?.charAt(0) || '?'}
                  </div>
                  {attendance.isLate ? (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                  ) : (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {attendance.employee?.fullName || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {attendance.checkIn ? formatTime(attendance.checkIn) : '--:--'}
                  </p>
                </div>

                {/* Status */}
                {attendance.isLate ? (
                  <span className="text-xs text-orange-600 font-medium">Muộn</span>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium">Đúng giờ</span>
                )}
              </div>
            ))
          )}

          {/* Footer Stats */}
          {recentCheckIns.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Tỷ lệ đúng giờ</span>
                <div className="flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-600">
                    {Math.round((recentCheckIns.filter(a => !a.isLate).length / recentCheckIns.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
