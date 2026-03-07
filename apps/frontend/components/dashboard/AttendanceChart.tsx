'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dashboardService from '@/services/dashboardService';

interface DailyAttendance {
  date: string;
  count: number;
}

export default function AttendanceChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      const response = await dashboardService.getAttendanceSummary();
      
      // Axios interceptor returns response.data directly, so response = { success: true, data: {...} }
      if (response.data) {
        const { trend, summary: summaryData } = response.data;
        setSummary(summaryData);

        // Build a map of date -> count from backend trend data
        const trendMap = new Map<string, number>(
          (trend || []).map((item: DailyAttendance) => [item.date, item.count])
        );

        // Always generate the last 7 calendar days so all bars are shown
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const formattedData = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          formattedData.push({
            day: dayNames[d.getDay()],
            count: trendMap.get(dateStr) ?? 0,
            date: dateStr,
          });
        }
        setData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-brandBlue/30 hover:shadow-lg transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Chấm công tuần này</h3>
          <p className="text-sm text-slate-500 mt-1">Tổng quan 7 ngày gần nhất</p>
        </div>
        <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20">
          <option>Tuần này</option>
          <option>Tuần trước</option>
          <option>Tháng này</option>
        </select>
      </div>

      {/* Chart */}
      <div className="h-64 flex items-end justify-between gap-4">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Không có dữ liệu chấm công
          </div>
        ) : (
          data.map((item, index) => {
            const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full flex flex-col-reverse gap-1 h-48">
                  {item.count > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="w-full bg-brandBlue rounded-t-lg relative group cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Chấm công: {item.count}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Day Label */}
                <span className="text-sm font-medium text-slate-600">{item.day}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-brandBlue">{summary.present}</p>
            <p className="text-xs text-slate-500">Có mặt</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary">{summary.late}</p>
            <p className="text-xs text-slate-500">Đi muộn</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{summary.presentRate}%</p>
            <p className="text-xs text-slate-500">Tỷ lệ</p>
          </div>
        </div>
      )}
    </div>
  );
}
