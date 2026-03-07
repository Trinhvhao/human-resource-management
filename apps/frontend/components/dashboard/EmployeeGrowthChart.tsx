'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, UserPlus, UserMinus } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface MonthlyGrowth {
  month: string;
  total: number;
  joined: number;
  left: number;
}

export default function EmployeeGrowthChart() {
  const [data, setData] = useState<MonthlyGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentTotal: 0,
    monthlyGrowth: 0,
    joinedThisMonth: 0,
    leftThisMonth: 0,
  });

  useEffect(() => {
    fetchEmployeeGrowth();
  }, []);

  const fetchEmployeeGrowth = async () => {
    try {
      // Fetch all employees (large limit to get everyone for accurate growth calc)
      const response = await axiosInstance.get('/employees', { params: { limit: 1000, page: 1 } });
      
      if (response.data) {
        const employees = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const currentTotal = employees.length;

        // Calculate last 6 months growth using startDate (not hireDate)
        const now = new Date();
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const growthData: MonthlyGrowth[] = [];

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthIndex = targetDate.getMonth();
          const year = targetDate.getFullYear();
          const endOfMonth = new Date(year, monthIndex + 1, 0);

          // Count employees who joined in this month (use startDate field)
          const joined = employees.filter((emp: any) => {
            const startDate = emp.startDate ? new Date(emp.startDate) : null;
            if (!startDate) return false;
            return startDate.getMonth() === monthIndex && startDate.getFullYear() === year;
          }).length;

          // Count employees who left in this month
          const left = employees.filter((emp: any) => {
            const endDate = emp.endDate ? new Date(emp.endDate) : null;
            if (!endDate) return false;
            return endDate.getMonth() === monthIndex && endDate.getFullYear() === year;
          }).length;

          // Total active employees at end of that month
          const total = employees.filter((emp: any) => {
            const startDate = emp.startDate ? new Date(emp.startDate) : null;
            if (!startDate) return false;
            if (startDate > endOfMonth) return false;
            const endDate = emp.endDate ? new Date(emp.endDate) : null;
            // Not yet left, or left after this month
            return !endDate || endDate >= endOfMonth;
          }).length;

          growthData.push({
            month: monthNames[monthIndex],
            total,
            joined,
            left,
          });
        }

        setData(growthData);

        // Calculate stats for current month
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const joinedThisMonth = employees.filter((emp: any) => {
          const startDate = emp.startDate ? new Date(emp.startDate) : null;
          if (!startDate) return false;
          return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
        }).length;

        const previousMonthTotal = growthData.length > 1 ? growthData[growthData.length - 2].total : currentTotal;
        const monthlyGrowth = previousMonthTotal > 0 
          ? ((currentTotal - previousMonthTotal) / previousMonthTotal) * 100 
          : 0;

        setStats({
          currentTotal,
          monthlyGrowth,
          joinedThisMonth,
          leftThisMonth: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch employee growth:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-slate-50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Tăng trưởng nhân sự</h3>
          <p className="text-sm text-slate-500 mt-1">6 tháng gần nhất</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Users className="text-blue-600" size={20} />
          <span className="text-sm font-bold text-blue-600">{stats.currentTotal}</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="h-40 relative mb-6">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Không có dữ liệu
          </div>
        ) : (
          <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={percent}
                x1="0"
                y1={160 - (percent * 1.6)}
                x2="400"
                y2={160 - (percent * 1.6)}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            ))}

            {/* Line path */}
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              d={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 400;
                const y = 160 - ((item.total / maxValue) * 140);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Area fill */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ duration: 1 }}
              d={`
                ${data.map((item, index) => {
                  const x = (index / (data.length - 1)) * 400;
                  const y = 160 - ((item.total / maxValue) * 140);
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                L 400 160 L 0 160 Z
              `}
              fill="#3b82f6"
            />

            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const y = 160 - ((item.total / maxValue) * 140);
              return (
                <motion.circle
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#3b82f6"
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-7 transition-all"
                >
                  <title>{item.month}: {item.total} nhân viên</title>
                </motion.circle>
              );
            })}
          </svg>
        )}
      </div>

      {/* Month labels */}
      <div className="flex justify-between mb-6 px-1">
        {data.map((item, index) => (
          <span key={index} className="text-xs font-medium text-slate-500">
            {item.month}
          </span>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className={stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'} />
            <span className={`text-sm font-bold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-slate-500">Tăng trưởng</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <UserPlus size={14} className="text-blue-600" />
            <span className="text-sm font-bold text-blue-600">+{stats.joinedThisMonth}</span>
          </div>
          <p className="text-xs text-slate-500">Tuyển mới</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <UserMinus size={14} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-600">{stats.leftThisMonth}</span>
          </div>
          <p className="text-xs text-slate-500">Nghỉ việc</p>
        </div>
      </div>
    </div>
  );
}
