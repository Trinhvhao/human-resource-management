'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';
import departmentService from '@/services/departmentService';

const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export default function DepartmentDistribution() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await departmentService.getAll();
      const departments = response.data || [];
      
      // Calculate employee count per department
      const distribution = departments
        .filter((dept: any) => dept._count?.employees > 0)
        .map((dept: any) => ({
          name: dept.name,
          value: dept._count?.employees || 0,
          percentage: 0,
        }))
        .sort((a: any, b: any) => b.value - a.value);

      // Calculate percentages
      const total = distribution.reduce((sum: number, item: any) => sum + item.value, 0);
      distribution.forEach((item: any) => {
        item.percentage = ((item.value / total) * 100).toFixed(1);
      });

      setData(distribution);
    } catch (error) {
      console.error('Failed to load department distribution:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const totalEmployees = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border border-slate-200">
          <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
          <p className="text-sm text-slate-600">
            <span className="font-bold text-brandBlue">{data.value}</span> nhân viên
          </p>
          <p className="text-xs text-slate-500 mt-1">{data.payload.percentage}% tổng số</p>
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
                <Users size={20} className="text-blue-600" />
              </div>
              Phân bố nhân viên theo phòng ban
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-600">{data.length} phòng ban</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Pie Chart - Centered with proper spacing */}
        <div className="flex items-center justify-center mb-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Show all departments */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 truncate font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{item.value} NV</p>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">Tổng cộng</span>
            </div>
            <span className="text-xl font-bold text-blue-600">{totalEmployees}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
