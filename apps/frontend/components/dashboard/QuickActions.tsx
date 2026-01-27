'use client';

import React from 'react';
import { UserPlus, Clock, FileText, DollarSign, Users, Calendar, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: UserPlus,
      label: 'Thêm nhân viên',
      color: 'text-white',
      bgColor: 'bg-brandBlue',
      hoverColor: 'hover:bg-blue-700',
      link: '/dashboard/employees/new',
      priority: 'high',
    },
    {
      icon: Clock,
      label: 'Chấm công',
      color: 'text-white',
      bgColor: 'bg-secondary',
      hoverColor: 'hover:bg-orange-600',
      link: '/dashboard/attendance',
      priority: 'high',
    },
    {
      icon: FileText,
      label: 'Đơn nghỉ phép',
      color: 'text-white',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
      link: '/dashboard/leaves',
      priority: 'high',
    },
    {
      icon: DollarSign,
      label: 'Quản lý lương',
      color: 'text-white',
      bgColor: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      link: '/dashboard/payroll',
      priority: 'high',
    },
    {
      icon: Users,
      label: 'Phòng ban',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 border-2 border-blue-200',
      hoverColor: 'hover:bg-blue-100 hover:border-blue-300',
      link: '/dashboard/departments',
      priority: 'medium',
    },
    {
      icon: Calendar,
      label: 'Tăng ca',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50 border-2 border-orange-200',
      hoverColor: 'hover:bg-orange-100 hover:border-orange-300',
      link: '/dashboard/overtime',
      priority: 'medium',
    },
    {
      icon: Award,
      label: 'Khen thưởng',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 border-2 border-yellow-200',
      hoverColor: 'hover:bg-yellow-100 hover:border-yellow-300',
      link: '/dashboard/rewards',
      priority: 'medium',
    },
    {
      icon: TrendingUp,
      label: 'Báo cáo',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50 border-2 border-indigo-200',
      hoverColor: 'hover:bg-indigo-100 hover:border-indigo-300',
      link: '/dashboard/attendance/reports',
      priority: 'medium',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
          <LayoutGrid className="text-brandBlue" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-primary">Thao tác nhanh</h3>
          <p className="text-sm text-slate-500">Truy cập nhanh các chức năng quan trọng</p>
        </div>
      </div>

      {/* Primary Actions - Highlighted */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isHighPriority = action.priority === 'high';

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => action.link !== '#' && router.push(action.link)}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-xl ${action.bgColor} ${action.hoverColor} transition-all shadow-md ${
                action.link === '#' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${isHighPriority ? '' : ''}`}
            >
              <div className="relative">
                <Icon className={action.color} size={28} strokeWidth={2} />
                {isHighPriority && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className={`text-sm font-semibold ${action.color} text-center leading-tight`}>
                {action.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function LayoutGrid({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
