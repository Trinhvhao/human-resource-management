'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OverviewCards from '@/components/dashboard/OverviewCards';
import AttendanceChart from '@/components/dashboard/AttendanceChart';
import EmployeeDistribution from '@/components/dashboard/EmployeeDistribution';
import RecentActivities from '@/components/dashboard/RecentActivities';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import QuickActions from '@/components/dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-slate-500 mt-1">Tổng quan hệ thống quản lý nhân sự</p>
        </div>

        {/* Overview Cards */}
        <OverviewCards />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendanceChart />
          <EmployeeDistribution />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
          <div>
            <AlertsPanel />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </DashboardLayout>
  );
}
