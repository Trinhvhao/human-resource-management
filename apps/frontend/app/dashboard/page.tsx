'use client';

import { useState, Suspense, lazy } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OverviewCards from '@/components/dashboard/OverviewCards';
import QuickActions from '@/components/dashboard/QuickActions';
import { RefreshCw } from 'lucide-react';

// Lazy load heavy components
const AttendanceChart = lazy(() => import('@/components/dashboard/AttendanceChart'));
const DepartmentDistribution = lazy(() => import('@/components/dashboard/DepartmentDistribution'));
const RecentActivities = lazy(() => import('@/components/dashboard/RecentActivities'));
const CriticalAlertsHub = lazy(() => import('@/components/dashboard/CriticalAlertsHub'));
const PayrollSummaryChart = lazy(() => import('@/components/dashboard/PayrollSummaryChart'));
const LeaveRequestsChart = lazy(() => import('@/components/dashboard/LeaveRequestsChart'));
const EmployeeGrowthChart = lazy(() => import('@/components/dashboard/EmployeeGrowthChart'));
const OvertimeSummary = lazy(() => import('@/components/dashboard/OvertimeSummary'));
const AbsenteeismRate = lazy(() => import('@/components/dashboard/AbsenteeismRate'));
const PayrollCostByDepartment = lazy(() => import('@/components/dashboard/PayrollCostByDepartment'));
const TodaySnapshot = lazy(() => import('@/components/dashboard/TodaySnapshot'));
const TurnoverRate = lazy(() => import('@/components/dashboard/TurnoverRate'));

// Loading skeleton component
const ChartSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse shadow-sm">
    <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
    <div className="h-48 bg-slate-50 rounded-lg"></div>
  </div>
);

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Action Bar */}
        <div className="flex justify-end items-center">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className="text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Làm mới</span>
          </button>
        </div>

        {/* Quick Actions - Always visible */}
        <QuickActions />

        {/* Today Snapshot - Real-time Indicators */}
        <Suspense fallback={<ChartSkeleton />}>
          <TodaySnapshot key={`snapshot-${refreshKey}`} />
        </Suspense>

        {/* Overview Cards - Key Metrics */}
        <OverviewCards key={`overview-${refreshKey}`} />

        {/* Critical Alerts Hub - Consolidated Alerts */}
        <Suspense fallback={<ChartSkeleton />}>
          <CriticalAlertsHub key={`alerts-${refreshKey}`} />
        </Suspense>

        {/* SECTION 1: WORKFORCE OVERVIEW - Tổng quan nhân sự */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-900">Tổng quan nhân sự</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <EmployeeGrowthChart key={`growth-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <DepartmentDistribution key={`department-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <TurnoverRate key={`turnover-${refreshKey}`} />
            </Suspense>
          </div>
        </div>

        {/* SECTION 2: TIME & ATTENDANCE - Chấm công & Thời gian */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-900">Chấm công & Thời gian</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <AttendanceChart key={`attendance-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <AbsenteeismRate key={`absenteeism-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <OvertimeSummary key={`overtime-${refreshKey}`} />
            </Suspense>
          </div>
        </div>

        {/* SECTION 3: LEAVE & PAYROLL - Nghỉ phép & Lương */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-purple-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-900">Nghỉ phép & Lương</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Suspense fallback={<ChartSkeleton />}>
              <LeaveRequestsChart key={`leave-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <PayrollSummaryChart key={`payroll-${refreshKey}`} />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <PayrollCostByDepartment key={`cost-${refreshKey}`} />
            </Suspense>
          </div>
        </div>

        {/* Recent Activities - Full Width */}
        <Suspense fallback={<ChartSkeleton />}>
          <RecentActivities key={`activities-${refreshKey}`} />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
