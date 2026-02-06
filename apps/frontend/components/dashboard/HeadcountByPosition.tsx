'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface PositionData {
  position: string;
  count: number;
  percentage: number;
  color: string;
}

export default function HeadcountByPosition() {
  const [data, setData] = useState<PositionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHeadcount();
  }, []);

  const fetchHeadcount = async () => {
    try {
      const response = await axiosInstance.get('/employees');
      
      if (response.data) {
        const employees = response.data;
        setTotal(employees.length);

        // Group by position
        const positionCounts: Record<string, number> = {};
        employees.forEach((emp: any) => {
          const position = emp.position || 'Chưa xác định';
          positionCounts[position] = (positionCounts[position] || 0) + 1;
        });

        // Convert to array and sort
        const positionData: PositionData[] = Object.entries(positionCounts)
          .map(([position, count], index) => ({
            position,
            count,
            percentage: (count / employees.length) * 100,
            color: getColor(index),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 positions

        setData(positionData);
      }
    } catch (error) {
      console.error('Failed to fetch headcount:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (index: number) => {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#6366f1', // indigo
    ];
    return colors[index % colors.length];
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Phân bố theo vị trí</h3>
          <p className="text-sm text-slate-500 mt-1">Top 6 vị trí</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <Users className="text-blue-600" size={20} />
          <span className="text-sm font-bold text-blue-600">{total}</span>
        </div>
      </div>

      {/* Position List */}
      <div className="space-y-4 flex-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users size={40} className="mx-auto mb-2" />
            <p>Không có dữ liệu</p>
          </div>
        ) : (
          data.map((item, index) => (
            <motion.div
              key={item.position}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Position Name & Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {item.position}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">{item.count}</span>
                  <span className="text-xs text-slate-500">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <TrendingUp size={16} className="text-green-600" />
            <span>Đa dạng vị trí</span>
          </div>
          <span className="font-bold text-slate-900">{data.length} vị trí</span>
        </div>
      </div>
    </div>
  );
}
