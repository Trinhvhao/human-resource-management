'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserMinus, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface TurnoverData {
  thisMonth: number;
  lastMonth: number;
  rate: number;
  change: number;
  topDepartment: string;
  trend: number[];
}

export default function TurnoverRate() {
  const [data, setData] = useState<TurnoverData>({
    thisMonth: 0,
    lastMonth: 0,
    rate: 0,
    change: 0,
    topDepartment: 'N/A',
    trend: [0, 0, 0, 0, 0, 0],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTurnover();
  }, []);

  const fetchTurnover = async () => {
    try {
      const response: any = await axiosInstance.get('/dashboard/turnover-stats?months=6');
      
      // Backend returns: { success: true, data: {...} }
      // Axios interceptor returns response.data directly
      if (response?.success && response?.data) {
        const turnoverData = response.data;
        
        setData({
          thisMonth: turnoverData.thisMonth || 0,
          lastMonth: turnoverData.lastMonth || 0,
          rate: turnoverData.rate || 0,
          change: turnoverData.change || 0,
          topDepartment: turnoverData.topDepartment || 'N/A',
          trend: turnoverData.trend || [0, 0, 0, 0, 0, 0],
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch turnover:', {
        message: error?.message,
        statusCode: error?.statusCode,
        path: error?.path,
      });
      // Keep default values on error
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

  const isImproving = data.change < 0;
  const isHealthy = data.rate < 5; // < 5% is healthy

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Tỷ lệ nghỉ việc</h3>
          <p className="text-sm text-slate-500 mt-1">Turnover Rate</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isHealthy ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <UserMinus className={isHealthy ? 'text-green-600' : 'text-red-600'} size={20} />
          <span className={`text-sm font-bold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
            {data.rate.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* This Month */}
        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Tháng này</p>
          <p className="text-3xl font-bold text-slate-900">{data.thisMonth}</p>
          <p className="text-xs text-slate-500 mt-1">người</p>
        </div>

        {/* Last Month */}
        <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Tháng trước</p>
          <p className="text-3xl font-bold text-slate-900">{data.lastMonth}</p>
          <p className="text-xs text-slate-500 mt-1">người</p>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className={`p-4 rounded-xl border-2 mb-4 ${
        isImproving 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isImproving ? (
              <TrendingDown className="text-green-600" size={20} />
            ) : (
              <TrendingUp className="text-red-600" size={20} />
            )}
            <span className={`text-sm font-semibold ${
              isImproving ? 'text-green-700' : 'text-red-700'
            }`}>
              {isImproving ? 'Giảm' : 'Tăng'} {Math.abs(data.change).toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-slate-600">vs tháng trước</span>
        </div>
      </div>

      {/* Trend Chart (Mini) */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2">Xu hướng 6 tháng</p>
        <div className="h-16 flex items-end justify-between gap-1">
          {data.trend.map((value, index) => {
            const maxValue = Math.max(...data.trend);
            const height = (value / maxValue) * 100;
            const isLast = index === data.trend.length - 1;
            
            return (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`flex-1 rounded-t ${
                  isLast 
                    ? value < 5 ? 'bg-green-500' : 'bg-red-500'
                    : 'bg-slate-300'
                }`}
                title={`${value.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-400">6 tháng trước</span>
          <span className="text-[10px] text-slate-400">Hiện tại</span>
        </div>
      </div>

      {/* Top Department */}
      <div className="mt-auto pt-4 border-t border-slate-200">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-slate-500">Phòng ban có tỷ lệ cao nhất:</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{data.topDepartment}</p>
          </div>
        </div>
      </div>

      {/* Health Indicator */}
      <div className={`mt-3 p-3 rounded-lg ${
        isHealthy ? 'bg-green-50' : 'bg-amber-50'
      }`}>
        <p className={`text-xs font-semibold ${
          isHealthy ? 'text-green-700' : 'text-amber-700'
        }`}>
          {isHealthy ? '✓ Tỷ lệ ở mức tốt' : '⚠ Cần theo dõi'}
        </p>
      </div>
    </div>
  );
}
