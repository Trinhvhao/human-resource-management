'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axiosInstance from '@/lib/axios';

interface DepartmentStats {
  departmentName: string;
  employeeCount: number;
  attendanceRate: number;
  performanceScore: number;
  trend: 'up' | 'down' | 'stable';
}

export default function DepartmentPerformance() {
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentStats();
  }, []);

  const fetchDepartmentStats = async () => {
    try {
      const response = await axiosInstance.get('/departments/performance-stats');
      
      if (response.data?.data) {
        const deptData = response.data.data;
        
        // Take top 5 departments
        const topDepts = deptData.slice(0, 5);
        
        setDepartments(topDepts);
      }
    } catch (error) {
      console.error('Failed to fetch department stats:', error);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (performanceScore: number) => {
    if (performanceScore >= 90) return '#10b981'; // green-500
    if (performanceScore >= 80) return '#3b82f6'; // blue-500
    if (performanceScore >= 70) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-primary mb-1">{data.departmentName}</p>
          <p className="text-sm text-slate-600">Hiệu suất: <span className="font-bold">{data.performanceScore}%</span></p>
          <p className="text-sm text-slate-600">Nhân viên: <span className="font-bold">{data.employeeCount}</span></p>
          <p className="text-sm text-slate-600">Chấm công: <span className="font-bold">{data.attendanceRate}%</span></p>
        </div>
      );
    }
    return null;
  };

  // Truncate long department names
  const truncateName = (name: string, maxLength: number = 15) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Top 5 Phòng Ban Xuất Sắc</h3>
          <p className="text-sm text-slate-500 mt-1">Theo hiệu suất tháng này</p>
        </div>
        <Building2 className="text-brandBlue" size={24} />
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={departments}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="departmentName"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={truncateName}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={[0, 100]}
              label={{ value: 'Hiệu suất (%)', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 12 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar dataKey="performanceScore" radius={[8, 8, 0, 0]}>
              {departments.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.performanceScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs text-slate-500 mb-1">Trung bình</p>
          <p className="text-lg font-bold text-brandBlue">
            {departments.length > 0 
              ? (departments.reduce((sum, d) => sum + d.performanceScore, 0) / departments.length).toFixed(0)
              : 0}%
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <p className="text-xs text-slate-500 mb-1">Cao nhất</p>
          <p className="text-lg font-bold text-green-600">
            {departments.length > 0 ? Math.max(...departments.map(d => d.performanceScore)) : 0}%
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-xs text-slate-500 mb-1">Thấp nhất</p>
          <p className="text-lg font-bold text-amber-600">
            {departments.length > 0 ? Math.min(...departments.map(d => d.performanceScore)) : 0}%
          </p>
        </motion.div>
      </div>
    </div>
  );
}
