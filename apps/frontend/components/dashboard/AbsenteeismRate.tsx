'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import axiosInstance from '@/lib/axios';

export default function AbsenteeismRate() {
  const [stats, setStats] = useState({
    todayAbsent: 0,
    weekAbsent: 0,
    monthAbsent: 0,
    absentRate: 0,
    lateRate: 0,
    trend: 0, // positive = increasing, negative = decreasing
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbsenteeism();
  }, []);

  const fetchAbsenteeism = async () => {
    try {
      const response = await axiosInstance.get('/attendances/absenteeism-stats');
      
      if (response.data?.data) {
        const data = response.data.data;
        
        setStats({
          todayAbsent: data.today.absent,
          weekAbsent: data.week.absent,
          monthAbsent: data.month.absent,
          absentRate: data.today.absentRate,
          lateRate: data.today.lateRate,
          trend: data.trend,
        });
      }
    } catch (error) {
      console.error('Failed to fetch absenteeism:', error);
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

  const isImproving = stats.trend < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Tỷ lệ vắng mặt</h3>
          <p className="text-sm text-slate-500 mt-1">Hôm nay</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
          <AlertCircle className="text-red-600" size={20} />
          <span className="text-sm font-bold text-red-600">{stats.todayAbsent}</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Absent Rate */}
        <div className="text-center p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="text-3xl font-bold text-red-600 mb-1">
            {stats.absentRate.toFixed(1)}%
          </div>
          <p className="text-xs text-red-700 font-medium">Vắng mặt</p>
        </div>

        {/* Late Rate */}
        <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
          <div className="text-3xl font-bold text-amber-600 mb-1">
            {stats.lateRate.toFixed(1)}%
          </div>
          <p className="text-xs text-amber-700 font-medium">Đi muộn</p>
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
              {isImproving ? 'Cải thiện' : 'Tăng'}
            </span>
          </div>
          <span className={`text-lg font-bold ${
            isImproving ? 'text-green-600' : 'text-red-600'
          }`}>
            {Math.abs(stats.trend).toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1">So với tuần trước</p>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Hôm nay</p>
          <p className="text-lg font-bold text-slate-900">{stats.todayAbsent}</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Tuần này</p>
          <p className="text-lg font-bold text-slate-900">{stats.weekAbsent}</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Tháng này</p>
          <p className="text-lg font-bold text-slate-900">{stats.monthAbsent}</p>
        </div>
      </div>
    </div>
  );
}
