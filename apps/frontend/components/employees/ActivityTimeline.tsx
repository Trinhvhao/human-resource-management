'use client';

import { useEffect, useState } from 'react';
import { 
  Clock, User, FileText, Upload, Edit, CheckCircle, XCircle, 
  Calendar, Award, AlertCircle, Briefcase, ChevronDown, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { employeeActivityService } from '@/services/employeeActivityService';
import { EmployeeActivity } from '@/types/employee-activity';
import { formatDate } from '@/utils/formatters';

interface ActivityTimelineProps {
  employeeId: string;
}

const activityIcons: Record<string, any> = {
  profile_update: Edit,
  document_upload: Upload,
  attendance: Calendar,
  leave_request: Calendar,
  overtime: Clock,
  reward: Award,
  discipline: AlertCircle,
  contract: FileText,
  default: Briefcase,
};

const activityColors: Record<string, string> = {
  profile_update: 'bg-blue-100 text-blue-600',
  document_upload: 'bg-purple-100 text-purple-600',
  attendance: 'bg-green-100 text-green-600',
  leave_request: 'bg-orange-100 text-orange-600',
  overtime: 'bg-yellow-100 text-yellow-600',
  reward: 'bg-pink-100 text-pink-600',
  discipline: 'bg-red-100 text-red-600',
  contract: 'bg-indigo-100 text-indigo-600',
  default: 'bg-slate-100 text-slate-600',
};

const actionLabels: Record<string, string> = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  deleted: 'Xóa',
  approved: 'Phê duyệt',
  rejected: 'Từ chối',
  submitted: 'Gửi yêu cầu',
};

export default function ActivityTimeline({ employeeId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [employeeId, page, filterType]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await employeeActivityService.getActivities(employeeId, {
        page,
        limit: 20,
        type: filterType || undefined,
      });
      setActivities(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const Icon = activityIcons[type] || activityIcons.default;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    return activityColors[type] || activityColors.default;
  };

  const getPerformerName = (activity: EmployeeActivity) => {
    if (!activity.performer) return 'Hệ thống';
    return activity.performer.employee?.fullName || activity.performer.email;
  };

  const getPerformerAvatar = (activity: EmployeeActivity) => {
    if (!activity.performer?.employee?.avatarUrl) return null;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${activity.performer.employee.avatarUrl}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return formatDate(dateString);
  };

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-500">Chưa có hoạt động nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-600 uppercase">
          Lịch sử hoạt động ({activities.length})
        </h3>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Filter size={16} />
          <span>Lọc</span>
          <ChevronDown size={16} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => setFilterType('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === '' 
                  ? 'bg-brandBlue text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType('profile_update')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'profile_update' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              Cập nhật hồ sơ
            </button>
            <button
              onClick={() => setFilterType('document_upload')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'document_upload' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              Tài liệu
            </button>
            <button
              onClick={() => setFilterType('attendance')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'attendance' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              Chấm công
            </button>
            <button
              onClick={() => setFilterType('leave_request')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterType === 'leave_request' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              }`}
            >
              Nghỉ phép
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

        {/* Activities */}
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.activityType);
            const colorClass = getActivityColor(activity.activityType);
            const performerAvatar = getPerformerAvatar(activity);

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex gap-4"
              >
                {/* Icon */}
                <div className={`relative z-10 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary mb-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {performerAvatar ? (
                            <img
                              src={performerAvatar}
                              alt={getPerformerName(activity)}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <User size={14} />
                          )}
                          <span>{getPerformerName(activity)}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                      {activity.action && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md">
                          {actionLabels[activity.action] || activity.action}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <span key={key} className="text-xs text-slate-500">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
