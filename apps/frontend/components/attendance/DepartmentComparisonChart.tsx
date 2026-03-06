'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, TrendingUp } from 'lucide-react';

interface DepartmentData {
  name: string;
  attendanceRate: number;
  lateRate: number;
  total: number;
}

interface DepartmentComparisonChartProps {
  data: DepartmentData[];
  loading?: boolean;
}

const DepartmentComparisonChart = memo(function DepartmentComparisonChart({ data, loading = false }: DepartmentComparisonChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-48 mb-4"></div>
          <div className="h-80 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Sort by late rate descending and take top 5
  const sortedData = [...data]
    .filter(d => d.total > 0) // Only show departments with employees
    .sort((a, b) => b.lateRate - a.lateRate)
    .slice(0, 5);

  // If no data, show empty state
  if (sortedData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top 5 phòng ban đi muộn</h3>
              <p className="text-sm text-slate-600 mt-1">So sánh tỷ lệ đi muộn giữa các phòng ban</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-80 flex flex-col items-center justify-center text-slate-400">
            <Building2 size={48} className="mb-3 opacity-50" />
            <p className="text-sm font-medium">Chưa có dữ liệu chấm công</p>
          </div>
        </div>
      </div>
    );
  }

  const getBarColor = (lateRate: number) => {
    if (lateRate < 10) return '#10b981'; // green
    if (lateRate < 20) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-slate-200">
          <p className="font-semibold text-slate-900 mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">
              Tỷ lệ đi muộn: <span className="font-bold text-orange-600">{data.lateRate}%</span>
            </p>
            <p className="text-slate-600">
              Tỷ lệ có mặt: <span className="font-bold text-emerald-600">{data.attendanceRate}%</span>
            </p>
            <p className="text-slate-600">
              Tổng nhân viên: <span className="font-bold">{data.total}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate summary stats
  const goodCount = sortedData.filter(d => d.lateRate < 10).length;
  const mediumCount = sortedData.filter(d => d.lateRate >= 10 && d.lateRate < 20).length;
  const badCount = sortedData.filter(d => d.lateRate >= 20).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Top 5 phòng ban đi muộn</h3>
              <p className="text-sm text-slate-600 mt-1">So sánh tỷ lệ đi muộn giữa các phòng ban</p>
            </div>
          </div>
          {badCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <TrendingUp size={16} className="text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">Cần cải thiện</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedData}
            layout="horizontal"
            margin={{ top: 10, right: 50, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              strokeOpacity={0.5}
              horizontal={true}
              vertical={false}
            />

            <XAxis
              type="number"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'auto']}
            />

            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              tick={{ fill: '#475569', fontSize: 13 }}
              width={120}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />

            <Bar
              dataKey="lateRate"
              radius={[0, 8, 8, 0]}
              label={{
                position: 'right',
                fill: '#475569',
                fontSize: 12,
                fontWeight: 600,
                formatter: (value: any) => `${value}%`
              }}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.lateRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-emerald-800">Tốt</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{goodCount}</p>
            <p className="text-xs text-emerald-700 mt-0.5">Dưới 10%</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
              <span className="text-xs font-bold text-amber-800">Trung bình</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{mediumCount}</p>
            <p className="text-xs text-amber-700 mt-0.5">10-20%</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
              <span className="text-xs font-bold text-red-800">Cần cải thiện</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{badCount}</p>
            <p className="text-xs text-red-700 mt-0.5">Trên 20%</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DepartmentComparisonChart;
