'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import dashboardService from '@/services/dashboardService';

export default function PayrollSummaryChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const fetchPayrollData = async () => {
    try {
      const response = await dashboardService.getPayrollSummary();
      if (response.data) {
        const { summary: summaryData } = response.data;
        setSummary(summaryData);
        
        // Get last 6 months
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const formattedData = summaryData.slice(-6).map((item: any) => ({
          month: monthNames[item.month - 1],
          amount: item.totalAmount,
          employees: item.employeeCount,
          status: item.status,
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
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

  const maxValue = Math.max(...data.map(d => d.amount), 1);
  const totalPayroll = data.reduce((sum, d) => sum + d.amount, 0);
  const avgPayroll = data.length > 0 ? totalPayroll / data.length : 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Tổng lương 6 tháng</h3>
          <p className="text-sm text-slate-500 mt-1">Theo tháng</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
          <DollarSign className="text-green-600" size={20} />
          <span className="text-sm font-bold text-green-600">
            {(totalPayroll / 1000000).toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 flex items-end justify-between gap-3">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            Không có dữ liệu lương
          </div>
        ) : (
          data.map((item, index) => {
            const height = maxValue > 0 ? (item.amount / maxValue) * 100 : 0;
            const isAboveAvg = item.amount > avgPayroll;

            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full flex flex-col-reverse gap-1 h-48">
                  {item.amount > 0 && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`w-full rounded-t-lg relative group cursor-pointer ${
                        isAboveAvg ? 'bg-green-500' : 'bg-brandBlue'
                      }`}
                    >
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        <div className="font-bold">{(item.amount / 1000000).toFixed(1)}M VNĐ</div>
                        <div className="text-slate-300">{item.employees} nhân viên</div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Month Label */}
                <span className="text-sm font-medium text-slate-600">{item.month}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Tổng cộng</p>
          <p className="text-lg font-bold text-primary">
            {(totalPayroll / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Trung bình</p>
          <p className="text-lg font-bold text-brandBlue">
            {(avgPayroll / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 mb-1">Tháng này</p>
          <p className="text-lg font-bold text-green-600">
            {data.length > 0 ? (data[data.length - 1].amount / 1000000).toFixed(1) : 0}M
          </p>
        </div>
      </div>
    </div>
  );
}
