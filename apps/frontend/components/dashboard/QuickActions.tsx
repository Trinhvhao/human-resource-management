'use client';

import React from 'react';
import { UserPlus, Clock, FileText, Download, Send, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickActions() {
  const actions = [
    {
      icon: UserPlus,
      label: 'Thêm nhân viên',
      color: 'text-brandBlue',
      bgColor: 'bg-brandBlue/10',
      hoverColor: 'hover:bg-brandBlue/20',
    },
    {
      icon: Clock,
      label: 'Chấm công thủ công',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      hoverColor: 'hover:bg-secondary/20',
    },
    {
      icon: FileText,
      label: 'Tạo báo cáo',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      hoverColor: 'hover:bg-purple-200',
    },
    {
      icon: Download,
      label: 'Xuất dữ liệu',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      hoverColor: 'hover:bg-green-200',
    },
    {
      icon: Send,
      label: 'Gửi thông báo',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      hoverColor: 'hover:bg-blue-200',
    },
    {
      icon: Settings,
      label: 'Cài đặt hệ thống',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
      hoverColor: 'hover:bg-slate-200',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Thao tác nhanh</h3>
        <p className="text-sm text-slate-500 mt-1">Các chức năng thường dùng</p>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl ${action.bgColor} ${action.hoverColor} transition-all hover:scale-105`}
            >
              <Icon className={action.color} size={24} />
              <span className="text-xs font-medium text-primary text-center">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
