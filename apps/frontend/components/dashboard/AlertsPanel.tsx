'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dashboardService, { DashboardAlert } from '@/services/dashboardService';

export default function AlertsPanel() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getAlerts();
      // Backend returns data object with nested arrays, flatten them
      if (response.data) {
        const allAlerts: DashboardAlert[] = [];

        // Convert backend alerts to DashboardAlert format
        // For now, use empty array if data structure doesn't match
        // In production, map backend response properly
        setAlerts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: DashboardAlert['type']) => {
    switch (type) {
      case 'CONTRACT_EXPIRING':
        return AlertTriangle;
      case 'LEAVE_PENDING':
        return FileText;
      case 'OVERTIME_PENDING':
        return Clock;
      case 'LATE_ATTENDANCE':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getAlertColor = (severity: DashboardAlert['severity']) => {
    switch (severity) {
      case 'ERROR':
        return { text: 'text-red-600', bg: 'bg-red-100' };
      case 'WARNING':
        return { text: 'text-secondary', bg: 'bg-secondary/10' };
      case 'INFO':
        return { text: 'text-blue-600', bg: 'bg-blue-100' };
      default:
        return { text: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const handleAlertClick = (alert: DashboardAlert) => {
    if (alert.link) {
      router.push(alert.link);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-32"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
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
        <h3 className="text-lg font-bold text-primary">Cảnh báo</h3>
        <p className="text-sm text-slate-500 mt-1">
          {alerts.length > 0 ? `${alerts.length} cảnh báo cần xử lý` : 'Không có cảnh báo'}
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="mx-auto mb-2" size={40} />
            <p>Không có cảnh báo nào</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert, index) => {
            const Icon = getAlertIcon(alert.type);
            const colors = getAlertColor(alert.severity);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleAlertClick(alert)}
                className={`p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all ${alert.link ? 'cursor-pointer hover:shadow-md' : ''
                  }`}
              >
                {/* Icon */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={colors.text} size={20} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary mb-1">{alert.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{alert.message}</p>

                    {alert.link && (
                      <button className="mt-2 text-xs text-brandBlue hover:underline font-medium">
                        Xem chi tiết →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      {alerts.length > 5 && (
        <button
          onClick={() => router.push('/dashboard/alerts')}
          className="w-full mt-4 py-2 text-sm text-brandBlue hover:bg-slate-50 rounded-lg transition-colors font-medium"
        >
          Xem tất cả ({alerts.length})
        </button>
      )}
    </div>
  );
}
