'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Clock, FileText, DollarSign, Users, Calendar, Award, TrendingUp, ChevronDown, Search, Zap, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface BadgeCounts {
  pendingLeaves: number;
  expiringContracts: number;
  pendingCorrections: number;
  todayAttendance: number;
}

export default function QuickActions() {
  const router = useRouter();
  const [showAllActions, setShowAllActions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [badges, setBadges] = useState<BadgeCounts>({
    pendingLeaves: 0,
    expiringContracts: 0,
    pendingCorrections: 0,
    todayAttendance: 0,
  });

  useEffect(() => {
    fetchBadgeCounts();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      const [leavesRes, contractsRes, attendanceRes] = await Promise.all([
        axiosInstance.get('/leave-requests').catch(() => ({ data: [] })),
        axiosInstance.get('/contracts').catch(() => ({ data: [] })),
        axiosInstance.get('/attendances/today/all').catch(() => ({ data: [] })),
      ]);

      // Pending leaves
      const pendingLeaves = leavesRes.data?.filter((l: any) => l.status === 'PENDING').length || 0;

      // Expiring contracts (within 30 days)
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiringContracts = contractsRes.data?.filter((c: any) => {
        if (c.status !== 'ACTIVE' || !c.endDate) return false;
        const endDate = new Date(c.endDate);
        return endDate >= now && endDate <= in30Days;
      }).length || 0;

      // Pending corrections (if endpoint exists)
      let pendingCorrections = 0;
      try {
        const correctionsRes = await axiosInstance.get('/attendance-corrections?status=PENDING');
        pendingCorrections = correctionsRes.data?.length || 0;
      } catch (error) {
        // Endpoint might not exist
      }

      // Today attendance count
      const todayAttendance = attendanceRes.data?.length || 0;

      setBadges({
        pendingLeaves,
        expiringContracts,
        pendingCorrections,
        todayAttendance,
      });
    } catch (error) {
      console.error('Failed to fetch badge counts:', error);
    }
  };

  const primaryActions = [
    {
      icon: UserPlus,
      label: 'Thêm nhân viên',
      description: 'Tạo hồ sơ nhân viên mới',
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      link: '/dashboard/employees/new',
      category: 'Nhân sự',
      badge: null,
    },
    {
      icon: Clock,
      label: 'Chấm công hôm nay',
      description: 'Xem chấm công hôm nay',
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      link: '/dashboard/attendance',
      category: 'Thời gian',
      badge: badges.todayAttendance,
      badgeColor: 'bg-white text-orange-600',
    },
    {
      icon: FileText,
      label: 'Duyệt đơn nghỉ phép',
      description: 'Đơn chờ duyệt',
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      link: '/dashboard/leaves?status=pending',
      category: 'Phê duyệt',
      badge: badges.pendingLeaves,
      badgeColor: 'bg-white text-purple-600',
      urgent: badges.pendingLeaves > 10,
    },
    {
      icon: DollarSign,
      label: 'Gia hạn hợp đồng',
      description: 'HĐ sắp hết hạn',
      color: 'text-white',
      bgColor: 'bg-gradient-to-br from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      link: '/dashboard/employees?filter=expiring-contracts',
      category: 'Hợp đồng',
      badge: badges.expiringContracts,
      badgeColor: 'bg-white text-green-600',
      urgent: badges.expiringContracts > 5,
    },
  ];

  const secondaryActions = [
    {
      icon: Users,
      label: 'Phòng ban',
      description: 'Quản lý cơ cấu tổ chức',
      link: '/dashboard/departments',
      category: 'Nhân sự',
      badge: null,
    },
    {
      icon: Calendar,
      label: 'Xử lý điều chỉnh',
      description: 'Điều chỉnh chấm công',
      link: '/dashboard/attendance/corrections',
      category: 'Thời gian',
      badge: badges.pendingCorrections,
      badgeColor: 'bg-orange-100 text-orange-600',
      urgent: badges.pendingCorrections > 5,
    },
    {
      icon: Award,
      label: 'Khen thưởng',
      description: 'Quản lý khen thưởng',
      link: '/dashboard/rewards',
      category: 'Phúc lợi',
      badge: null,
    },
    {
      icon: TrendingUp,
      label: 'Báo cáo',
      description: 'Xem báo cáo chi tiết',
      link: '/dashboard/attendance/reports',
      category: 'Báo cáo',
      badge: null,
    },
    {
      icon: BarChart3,
      label: 'Quản lý lương',
      description: 'Tính lương và payroll',
      link: '/dashboard/payroll',
      category: 'Lương',
      badge: null,
    },
  ];

  const allActions = [...primaryActions, ...secondaryActions];
  
  const filteredActions = searchQuery
    ? allActions.filter(action => 
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allActions;

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Thao tác nhanh</h3>
            <p className="text-sm text-slate-500">Truy cập nhanh các chức năng quan trọng</p>
          </div>
        </div>

        {/* Search & Toggle */}
        <div className="flex items-center gap-2">
          {showAllActions && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-48"
              />
            </motion.div>
          )}
          
          <button
            onClick={() => setShowAllActions(!showAllActions)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
          >
            {showAllActions ? 'Thu gọn' : 'Xem tất cả'}
            <ChevronDown 
              size={16} 
              className={`transition-transform ${showAllActions ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Primary Actions - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryActions.map((action, index) => {
          const Icon = action.icon;
          // Extract gradient colors for inline style
          const gradientStyle = action.label === 'Thêm nhân viên' 
            ? { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }
            : action.label === 'Chấm công hôm nay'
            ? { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }
            : action.label === 'Duyệt đơn nghỉ phép'
            ? { background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' }
            : { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' };

          return (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(action.link)}
              style={gradientStyle}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
            >
              {/* Urgent Pulse Indicator */}
              {action.urgent && action.badge && action.badge > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse">
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                </div>
              )}

              {/* Badge */}
              {action.badge !== null && action.badge > 0 && (
                <div className={`absolute -top-2 -right-2 min-w-[24px] h-6 px-2 rounded-full ${action.badgeColor} flex items-center justify-center font-bold text-xs shadow-lg`}>
                  {action.badge > 99 ? '99+' : action.badge}
                </div>
              )}

              <div className="relative">
                <Icon className={action.color} size={32} strokeWidth={2} />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="text-center">
                <span className={`block text-sm font-bold ${action.color} mb-1`}>
                  {action.label}
                </span>
                <span className={`block text-xs ${action.color} opacity-80`}>
                  {action.description}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Secondary Actions - Expandable */}
      <AnimatePresence>
        {showAllActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-200">
              {searchQuery && (
                <p className="text-sm text-slate-600 mb-3">
                  Tìm thấy {filteredActions.length} kết quả
                </p>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {(searchQuery ? filteredActions : secondaryActions).map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(action.link)}
                      className="group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      {/* Urgent Ring Indicator */}
                      {action.urgent && action.badge && action.badge > 0 && (
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl opacity-75 blur-sm animate-pulse"></div>
                      )}

                      {/* Badge */}
                      {action.badge !== null && action.badge > 0 && (
                        <div className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full ${action.badgeColor || 'bg-red-500 text-white'} flex items-center justify-center font-bold text-xs shadow-md z-10`}>
                          {action.badge > 99 ? '99+' : action.badge}
                        </div>
                      )}

                      <div className="relative w-12 h-12 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <Icon className="text-slate-600 group-hover:text-blue-600 transition-colors" size={24} />
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                          {action.label}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {action.description}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 rounded-full transition-colors">
                        {action.category}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
