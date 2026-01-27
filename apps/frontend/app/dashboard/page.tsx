'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OverviewCards from '@/components/dashboard/OverviewCards';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import EmployeeDistribution from '@/components/dashboard/EmployeeDistribution';
import RecentActivities from '@/components/dashboard/RecentActivities';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import QuickActions from '@/components/dashboard/QuickActions';
import PayrollSummaryChart from '@/components/dashboard/PayrollSummaryChart';
import LeaveRequestsChart from '@/components/dashboard/LeaveRequestsChart';
import AttendanceHeatmap from '@/components/dashboard/AttendanceHeatmap';
import TopPerformers from '@/components/dashboard/TopPerformers';
import ExpiringContracts from '@/components/dashboard/ExpiringContracts';
import DepartmentPerformance from '@/components/dashboard/DepartmentPerformance';
import { LayoutGrid, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Quick Actions - TOP PRIORITY */}
        <QuickActions />

        {/* Overview Cards */}
        <OverviewCards />

        {/* Alerts & Expiring Contracts Row - High Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsPanel />
          <ExpiringContracts />
        </div>

        {/* Main Charts Row - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AttendanceChart />
          <EmployeeDistribution />
          <LeaveRequestsChart />
        </div>

        {/* Secondary Charts Row - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PayrollSummaryChart />
          <AttendanceHeatmap />
        </div>

        {/* Performance & Top Performers Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DepartmentPerformance />
          </div>
          <TopPerformers />
        </div>

        {/* Recent Activities - Bottom */}
        <RecentActivities />
      </div>
    </DashboardLayout>
  );
}
