'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function EmployeeDistribution() {
  const departments = [
    { name: 'Công nghệ', count: 85, color: 'bg-brandBlue', percentage: 34 },
    { name: 'Kinh doanh', count: 62, color: 'bg-secondary', percentage: 25 },
    { name: 'Marketing', count: 45, color: 'bg-purple-500', percentage: 18 },
    { name: 'Nhân sự', count: 28, color: 'bg-green-500', percentage: 11 },
    { name: 'Khác', count: 28, color: 'bg-slate-400', percentage: 11 },
  ];

  const total = departments.reduce((sum, dept) => sum + dept.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Phân bố nhân viên</h3>
        <p className="text-sm text-slate-500 mt-1">Theo phòng ban</p>
      </div>

      {/* Donut Chart */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Center Circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{total}</p>
              <p className="text-sm text-slate-500">Nhân viên</p>
            </div>
          </div>

          {/* SVG Donut */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {departments.map((dept, index) => {
              const prevPercentages = departments
                .slice(0, index)
                .reduce((sum, d) => sum + d.percentage, 0);
              const circumference = 2 * Math.PI * 40;
              const offset = circumference - (dept.percentage / 100) * circumference;
              const rotation = (prevPercentages / 100) * 360;

              return (
                <motion.circle
                  key={dept.name}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={dept.color.replace('bg-', '')}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ delay: index * 0.2, duration: 1 }}
                  style={{
                    transformOrigin: '50% 50%',
                    transform: `rotate(${rotation}deg)`,
                  }}
                  className="transition-all hover:stroke-[14]"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {departments.map((dept, index) => (
          <motion.div
            key={dept.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
              <span className="text-sm text-slate-600">{dept.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary">{dept.count}</span>
              <span className="text-xs text-slate-400 w-12 text-right">{dept.percentage}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
