'use client';

import React, { useEffect, useState } from 'react';
import { Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';
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
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'login':
      case 'employee_created':
      case 'employee_updated':
        return User;
      case 'leave_created':
      case 'leave_approved':
      case 'leave_rejected':
        return FileText;
      case 'attendance_checkin':
      case 'attendance_checkout':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    if (type.includes('approve')) return 'text-green-600';
    if (type.includes('reject')) return 'text-red-600';
    if (type.includes('create')) return 'text-blue-600';
    return 'text-slate-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-primary">Hoạt động gần đây</h3>
        <p className="text-sm text-slate-500 mt-1">10 hoạt động mới nhất</p>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Clock className="mx-auto mb-2" size={40} />
            <p>Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const color = getActivityColor(activity.type);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={color} size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary line-clamp-1">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{activity.user}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">
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

      {/* Refresh Button */}
      <button
        onClick={fetchActivities}
        className="w-full mt-4 py-2 text-sm text-brandBlue hover:bg-slate-50 rounded-lg transition-colors font-medium"
      >
        Làm mới
      </button>
    </div>
  );
}
