'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceChart() {
  // Simulated data for 7 days
  const data = [
    { day: 'T2', present: 235, late: 12, absent: 1 },
    { day: 'T3', present: 240, late: 8, absent: 0 },
    { day: 'T4', present: 238, late: 10, absent: 0 },
    { day: 'T5', present: 242, late: 6, absent: 0 },
    { day: 'T6', present: 245, late: 3, absent: 0 },
    { day: 'T7', present: 230, late: 15, absent: 3 },
    { day: 'CN', present: 0, late: 0, absent: 0 },
  ];

  const maxValue = Math.max(...data.map(d => d.present + d.late + d.absent));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
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
        {data.map((item, index) => {
          const total = item.present + item.late + item.absent;
          const presentHeight = maxValue > 0 ? (item.present / maxValue) * 100 : 0;
          const lateHeight = maxValue > 0 ? (item.late / maxValue) * 100 : 0;

          return (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              {/* Bar */}
              <div className="w-full flex flex-col-reverse gap-1 h-48">
                {/* Present */}
                {item.present > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${presentHeight}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="w-full bg-brandBlue rounded-t-lg relative group cursor-pointer"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Có mặt: {item.present}
                    </div>
                  </motion.div>
                )}
                
                {/* Late */}
                {item.late > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${lateHeight}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className="w-full bg-secondary rounded-t-lg relative group cursor-pointer"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Đi muộn: {item.late}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Day Label */}
              <span className="text-sm font-medium text-slate-600">{item.day}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brandBlue"></div>
          <span className="text-sm text-slate-600">Có mặt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary"></div>
          <span className="text-sm text-slate-600">Đi muộn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-slate-600">Vắng mặt</span>
        </div>
      </div>
    </div>
  );
}
