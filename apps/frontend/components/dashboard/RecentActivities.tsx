'use client';

import React, { useEffect, useState } from 'react';
import { Clock, User, FileText, CheckCircle, XCircle, UserPlus, Calendar, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import dashboardService, { RecentActivity } from '@/services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function RecentActivities() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getRecentActivities(10);
      
      if (response.data) {
        setActivities(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'employee_created':
        return UserPlus;
      case 'employee_updated':
        return User;
      case 'leave_created':
      case 'leave_pending':
        return Calendar;
      case 'leave_approved':
        return CheckCircle;
      case 'leave_rejected':
        return XCircle;
      case 'attendance_checkin':
        return CheckCircle;
      case 'attendance_checkout':
        return Clock;
      case 'payroll_created':
      case 'payroll_finalized':
        return DollarSign;
      default:
        return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    if (type.includes('approve') || type.includes('checkin')) return 'text-green-600 bg-green-50';
    if (type.includes('reject')) return 'text-red-600 bg-red-50';
    if (type.includes('create')) return 'text-blue-600 bg-blue-50';
    if (type.includes('payroll')) return 'text-green-600 bg-green-50';
    if (type.includes('leave')) return 'text-purple-600 bg-purple-50';
    return 'text-slate-600 bg-slate-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Hoạt động gần đây</h3>
          <p className="text-sm text-slate-500 mt-1">10 hoạt động mới nhất</p>
        </div>
        <button
          onClick={fetchActivities}
          className="text-sm text-brandBlue hover:underline font-medium"
        >
          Làm mới
        </button>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-400">
            <Clock className="mx-auto mb-3" size={48} />
            <p className="text-lg">Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary font-medium line-clamp-2 mb-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">{activity.user}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
