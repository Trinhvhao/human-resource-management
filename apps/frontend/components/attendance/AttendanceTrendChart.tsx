'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendData {
  date: string;
  attendanceRate: number;
  lateRate: number;
  total: number;
}

interface AttendanceTrendChartProps {
  data: TrendData[];
  loading?: boolean;
}

export default function AttendanceTrendChart({ data, loading = false }: AttendanceTrendChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Check if we have valid data
  const hasData = data && data.length > 0;

  const avgAttendance = hasData ? Math.round(data.reduce((sum, d) => sum + d.attendanceRate, 0) / data.length) : 0;
  const avgLate = hasData ? Math.round(data.reduce((sum, d) => sum + d.lateRate, 0) / data.length) : 0;
  const trend = hasData && data.length >= 2 ? data[data.length - 1].attendanceRate - data[0].attendanceRate : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Có mặt:</span>
              <span className="text-sm font-semibold text-emerald-600">{payload[0].value}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Đi muộn:</span>
              <span className="text-sm font-semibold text-orange-600">{payload[1].value}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              Xu hướng 7 ngày
            </h3>
            <p className="text-sm text-slate-600 mt-1 ml-11">Biến động tỷ lệ chấm công và đi muộn</p>
          </div>
          <div className="flex items-center gap-2">
            {trend > 0 ? (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">+{trend.toFixed(1)}%</span>
              </div>
            ) : trend < 0 ? (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                <TrendingUp size={16} className="text-red-600 rotate-180" />
                <span className="text-sm font-semibold text-red-600">{trend.toFixed(1)}%</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        {hasData ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  tick={{ fill: '#475569' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: '#475569' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                  iconType="circle"
                />
                <Area
                  type="monotone"
                  dataKey="attendanceRate"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorAttendance)"
                  dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Tỷ lệ có mặt"
                />
                <Area
                  type="monotone"
                  dataKey="lateRate"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#colorLate)"
                  dot={{ fill: '#f59e0b', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                  name="Tỷ lệ đi muộn"
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <p className="text-xs font-semibold text-emerald-700 uppercase">Trung bình có mặt</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{avgAttendance}%</p>
                  <p className="text-xs text-emerald-600 mt-0.5">7 ngày qua</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-xs font-semibold text-orange-700 uppercase">Trung bình đi muộn</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{avgLate}%</p>
                  <p className="text-xs text-orange-600 mt-0.5">7 ngày qua</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <TrendingUp size={32} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Không có dữ liệu chấm công</p>
            <p className="text-xs text-slate-500">Dữ liệu sẽ xuất hiện khi có check-in</p>
          </div>
        )}
      </div>
    </div>
  );
}
