'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, FileText, Zap, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Alert {
  id: string;
  type: 'contract' | 'leave' | 'attendance' | 'overtime';
  title: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  link: string;
  items?: Array<{
    name: string;
    detail: string;
    daysLeft?: number;
  }>;
}

export default function CriticalAlertsHub() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const axiosInstance = (await import('@/lib/axios')).default;
      
      // Single API call to get all alerts
      const response: any = await axiosInstance.get('/dashboard/alerts');
      
      if (response?.success && response?.data) {
        const alertsData = response.data;
        const allAlerts: Alert[] = [];

        // 1. Expiring Contracts
        if (alertsData.expiringContracts && alertsData.expiringContracts.length > 0) {
          const items = alertsData.expiringContracts.slice(0, 3).map((contract: any) => ({
            name: contract.employee?.fullName || 'N/A',
            detail: contract.employee?.employeeCode || 'N/A',
            daysLeft: contract.daysRemaining
          }));

          allAlerts.push({
            id: 'contracts',
            type: 'contract',
            title: 'Hợp đồng sắp hết hạn',
            count: alertsData.expiringContracts.length,
            severity: alertsData.expiringContracts.some((c: any) => c.daysRemaining <= 7) ? 'critical' : 'warning',
            link: '/dashboard/employees?filter=expiring-contracts',
            items
          });
        }

        // 2. Pending Leave Requests
        if (alertsData.pendingLeaveRequests && alertsData.pendingLeaveRequests.length > 0) {
          allAlerts.push({
            id: 'leaves',
            type: 'leave',
            title: 'Đơn nghỉ phép chờ duyệt',
            count: alertsData.pendingLeaveRequests.length,
            severity: 'warning',
            link: '/dashboard/leaves?status=pending'
          });
        }

        // 3. Frequent Late Employees
        if (alertsData.frequentLateEmployees) {
          const lateCount = alertsData.frequentLateEmployees.filter((e: any) => e.lateCount >= 3).length;
          if (lateCount > 0) {
            allAlerts.push({
              id: 'attendance',
              type: 'attendance',
              title: 'Nhân viên đi muộn thường xuyên',
              count: lateCount,
              severity: 'warning',
              link: '/dashboard/attendance?status=late'
            });
          }
        }

        // 4. Pending Overtime Requests (now included in alerts response)
        if (alertsData.pendingOvertimeCount && alertsData.pendingOvertimeCount > 0) {
          allAlerts.push({
            id: 'overtime',
            type: 'overtime',
            title: 'Yêu cầu tăng ca chờ duyệt',
            count: alertsData.pendingOvertimeCount,
            severity: 'info',
            link: '/dashboard/overtime?status=pending'
          });
        }

        setAlerts(allAlerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'contract': return Clock;
      case 'leave': return FileText;
      case 'attendance': return AlertTriangle;
      case 'overtime': return Zap;
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        icon: 'text-red-600'
      };
      case 'warning': return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
        icon: 'text-amber-600'
      };
      case 'info': return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700',
        icon: 'text-blue-600'
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.count, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200" style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Cảnh báo quan trọng</h3>
              <p className="text-sm text-slate-600 mt-0.5">{totalAlerts} vấn đề cần xử lý</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={32} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Không có cảnh báo</p>
            <p className="text-xs text-slate-500 mt-1">Mọi thứ đang hoạt động tốt</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const Icon = getIcon(alert.type);
              const colors = getSeverityColor(alert.severity);
              const isExpanded = expandedAlert === alert.id;

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${colors.bg} ${colors.border} border rounded-xl overflow-hidden`}
                >
                  {/* Alert Header - Clickable */}
                  <div
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    className="p-4 cursor-pointer hover:bg-opacity-80 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 ${colors.badge} rounded-lg`}>
                          <Icon size={18} className={colors.icon} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-semibold ${colors.text}`}>{alert.title}</h4>
                            <span className={`px-2 py-0.5 ${colors.badge} rounded-full text-xs font-bold`}>
                              {alert.count}
                            </span>
                          </div>
                          
                          {/* Preview items for contracts when collapsed */}
                          {!isExpanded && alert.items && alert.items.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-700">{alert.items[0].name}</span>
                                {alert.items[0].daysLeft !== undefined && (
                                  <span className={`font-semibold ${colors.text}`}>
                                    Còn {alert.items[0].daysLeft} ngày
                                  </span>
                                )}
                              </div>
                              {alert.items.length > 1 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  +{alert.items.length - 1} người khác
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronDown 
                          size={20} 
                          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && alert.items && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-200 bg-white"
                      >
                        <div className="p-4 space-y-2">
                          {alert.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-slate-700">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.detail}</p>
                              </div>
                              {item.daysLeft !== undefined && (
                                <span className={`text-sm font-bold ${colors.text}`}>
                                  Còn {item.daysLeft} ngày
                                </span>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => router.push(alert.link)}
                            className="w-full mt-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            Xem tất cả
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
