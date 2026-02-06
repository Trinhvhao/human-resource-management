'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Umbrella, Heart, Plane } from 'lucide-react';
import axiosInstance from '@/lib/axios';

interface LeaveTypeBalance {
  type: string;
  label: string;
  used: number;
  remaining: number;
  total: number;
  icon: any;
  color: string;
  bgColor: string;
}

export default function LeaveBalanceOverview() {
  const [balances, setBalances] = useState<LeaveTypeBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsed, setTotalUsed] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);

  useEffect(() => {
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      // Fetch leave requests to calculate usage
      const response = await axiosInstance.get('/leave-requests');
      
      if (response.data) {
        const requests = response.data;
        
        // Calculate by leave type
        const annualUsed = requests
          .filter((r: any) => r.leaveType === 'ANNUAL' && r.status === 'APPROVED')
          .reduce((sum: number, r: any) => sum + (r.totalDays || 0), 0);
        
        const sickUsed = requests
          .filter((r: any) => r.leaveType === 'SICK' && r.status === 'APPROVED')
          .reduce((sum: number, r: any) => sum + (r.totalDays || 0), 0);
        
        const personalUsed = requests
          .filter((r: any) => r.leaveType === 'PERSONAL' && r.status === 'APPROVED')
          .reduce((sum: number, r: any) => sum + (r.totalDays || 0), 0);

        // Standard allocations (would come from policy)
        const annualTotal = 12;
        const sickTotal = 10;
        const personalTotal = 5;

        const leaveData: LeaveTypeBalance[] = [
          {
            type: 'ANNUAL',
            label: 'Nghỉ phép năm',
            used: annualUsed,
            remaining: annualTotal - annualUsed,
            total: annualTotal,
            icon: Plane,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
          },
          {
            type: 'SICK',
            label: 'Nghỉ ốm',
            used: sickUsed,
            remaining: sickTotal - sickUsed,
            total: sickTotal,
            icon: Heart,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
          },
          {
            type: 'PERSONAL',
            label: 'Nghỉ cá nhân',
            used: personalUsed,
            remaining: personalTotal - personalUsed,
            total: personalTotal,
            icon: Umbrella,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
        ];

        setBalances(leaveData);
        setTotalUsed(annualUsed + sickUsed + personalUsed);
        setTotalRemaining((annualTotal - annualUsed) + (sickTotal - sickUsed) + (personalTotal - personalUsed));
      }
    } catch (error) {
      console.error('Failed to fetch leave balances:', error);
      setBalances([]);
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Số dư nghỉ phép</h3>
          <p className="text-sm text-slate-500 mt-1">Trung bình toàn công ty</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
          <Calendar className="text-purple-600" size={20} />
          <span className="text-sm font-bold text-purple-600">{totalRemaining}</span>
        </div>
      </div>

      {/* Leave Types */}
      <div className="space-y-4 flex-1">
        {balances.map((balance, index) => {
          const Icon = balance.icon;
          const usagePercentage = (balance.used / balance.total) * 100;

          return (
            <motion.div
              key={balance.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 ${balance.bgColor} border-${balance.color.replace('text-', '')}-200`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 ${balance.bgColor} rounded-lg`}>
                    <Icon className={balance.color} size={18} />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    {balance.label}
                  </span>
                </div>
                <span className={`text-lg font-bold ${balance.color}`}>
                  {balance.remaining}/{balance.total}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePercentage}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                  className={`h-full rounded-full ${balance.color.replace('text-', 'bg-')}`}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-600">Đã dùng: {balance.used} ngày</span>
                <span className={`font-bold ${balance.color}`}>
                  {usagePercentage.toFixed(0)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Đã sử dụng</p>
            <p className="text-2xl font-bold text-slate-900">{totalUsed}</p>
            <p className="text-xs text-slate-500">ngày</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Còn lại</p>
            <p className="text-2xl font-bold text-purple-600">{totalRemaining}</p>
            <p className="text-xs text-slate-500">ngày</p>
          </div>
        </div>
      </div>
    </div>
  );
}
