'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PageHeader from '@/components/common/PageHeader';
import AttendanceStatsBar from '@/components/attendance/AttendanceStatsBar';
import AttendanceFilterPanel from '@/components/attendance/AttendanceFilterPanel';
import TodayAttendanceTable from '@/components/attendance/TodayAttendanceTable';
import AttendanceLiveFeed from '@/components/attendance/AttendanceLiveFeed';
import AttendanceInsights from '@/components/attendance/AttendanceInsights';
import AttendanceTrendChart from '@/components/attendance/AttendanceTrendChart';
import AttendanceQuickStats from '@/components/attendance/AttendanceQuickStats';
import TimePeriodTabs from '@/components/attendance/TimePeriodTabs';
import { Plus, FileText, Settings } from 'lucide-react';
import attendanceService from '@/services/attendanceService';
import employeeService from '@/services/employeeService';
import departmentService from '@/services/departmentService';
import { useAuthStore } from '@/store/authStore';
import { Attendance } from '@/types/attendance';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function AttendancePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [pendingCorrections, setPendingCorrections] = useState(0);

  // Stats
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [notCheckedOutCount, setNotCheckedOutCount] = useState(0);

  // Time period
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month'>('today');

  // Chart data
  const [trendData, setTrendData] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch departments
      const deptResponse = await departmentService.getAll();
      setDepartments(deptResponse.data.map((d: any) => ({ id: d.id, name: d.name })));

      // Fetch pending corrections
      if (isAdmin) {
        try {
          const correctionsResponse = await attendanceService.getPendingCorrections();
          setPendingCorrections(correctionsResponse.data?.length || 0);
        } catch (error) {
          console.error('Failed to fetch pending corrections:', error);
          setPendingCorrections(0);
        }
      }

      // Fetch today's all attendances
      const attendancesResponse = await attendanceService.getTodayAllAttendances();
      const attendanceData = attendancesResponse.data || [];

      setAttendances(attendanceData);

      // Fetch total active employees to calculate correct stats
      const employeesResponse = await employeeService.getAll({ status: 'ACTIVE', limit: 1000 });
      const totalActiveEmployees = employeesResponse.meta?.total || employeesResponse.data?.length || 0;

      // Calculate stats
      const presentToday = attendanceData.filter((a: Attendance) => a.status === 'PRESENT').length;
      const lateToday = attendanceData.filter((a: Attendance) => a.isLate).length;
      const absentToday = totalActiveEmployees - presentToday; // Absent = total - present

      setTotalEmployees(totalActiveEmployees);
      setPresentCount(presentToday);
      setLateCount(lateToday);
      setAbsentCount(absentToday);
      setNotCheckedOutCount(attendanceData.filter((a: Attendance) => a.checkIn && !a.checkOut).length);

      // Mock trend data for now (you can fetch real data from API later)
      setTrendData([
        { date: 'T2', attendanceRate: 92, lateRate: 8, total: totalActiveEmployees },
        { date: 'T3', attendanceRate: 95, lateRate: 5, total: totalActiveEmployees },
        { date: 'T4', attendanceRate: 88, lateRate: 12, total: totalActiveEmployees },
        { date: 'T5', attendanceRate: 93, lateRate: 7, total: totalActiveEmployees },
        { date: 'T6', attendanceRate: 90, lateRate: 10, total: totalActiveEmployees },
        { date: 'T7', attendanceRate: 96, lateRate: 4, total: totalActiveEmployees },
        { date: 'CN', attendanceRate: 100, lateRate: 0, total: totalActiveEmployees },
      ]);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter attendances
  const filteredAttendances = attendances.filter((attendance) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = attendance.employee?.fullName?.toLowerCase().includes(searchLower);
      const matchesCode = attendance.employee?.employeeCode?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesCode) return false;
    }

    // Department filter
    if (departmentFilter !== 'all') {
      if (attendance.employee?.department?.name !== departments.find((d) => d.id === departmentFilter)?.name) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'on-time' && (attendance.isLate || !attendance.checkIn)) return false;
      if (statusFilter === 'late' && !attendance.isLate) return false;
      if (statusFilter === 'absent' && attendance.status !== 'ABSENT') return false;
      if (statusFilter === 'not-checked-out' && (attendance.checkOut || !attendance.checkIn)) return false;
    }

    return true;
  });

  const activeFilterCount = [
    departmentFilter !== 'all',
    statusFilter !== 'all',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setDepartmentFilter('all');
    setStatusFilter('all');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Paginate filtered results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAttendances = filteredAttendances.slice(startIndex, endIndex);

  const handleExport = () => {
    alert('Xuất báo cáo chấm công - Tính năng đang phát triển');
  };

  const handleViewDetail = (attendance: Attendance) => {
    router.push(`/dashboard/attendance/detail/${attendance.id}`);
  };

  const handleManualCheckIn = async () => {
    try {
      await attendanceService.checkIn();
      alert('Check-in thủ công thành công');
      fetchData();
    } catch (error) {
      console.error('Manual check-in failed:', error);
      alert('Check-in thất bại');
    }
  };

  return (
    <ProtectedRoute requiredPermission="VIEW_ALL_ATTENDANCE">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Action Bar - Replace PageHeader */}
          <div className="flex items-center justify-between">
            <TimePeriodTabs
              activePeriod={activePeriod}
              onPeriodChange={setActivePeriod}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/attendance/corrections')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:border-brandBlue hover:text-brandBlue font-semibold text-sm transition-all"
              >
                <FileText size={18} />
                Điều chỉnh
              </button>
              <button
                onClick={() => router.push('/dashboard/attendance/reports')}
                className="flex items-center gap-2 px-4 py-2.5 bg-brandBlue text-white rounded-xl hover:bg-blue-700 font-semibold text-sm transition-all shadow-lg shadow-brandBlue/30"
              >
                <Plus size={18} />
                Báo cáo
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <AttendanceStatsBar
            totalEmployees={totalEmployees}
            present={presentCount}
            late={lateCount}
            absent={absentCount}
            pendingCorrections={pendingCorrections}
            loading={loading}
            onViewCorrections={() => router.push('/dashboard/attendance/corrections')}
          />

          {/* Analytics Dashboard - 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <AttendanceTrendChart data={trendData} loading={loading} />
            </div>
            <div className="lg:col-span-3">
              <AttendanceQuickStats
                totalEmployees={totalEmployees}
                present={presentCount}
                late={lateCount}
                absent={absentCount}
                notCheckedOut={notCheckedOutCount}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-4">
              <AttendanceLiveFeed
                recentCheckIns={attendances.slice(0, 10)}
                loading={loading}
              />
            </div>
          </div>

          {/* Filter Panel */}
          <AttendanceFilterPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            dateFilter={dateFilter}
            onDateChange={setDateFilter}
            departments={departments}
            activeFilterCount={activeFilterCount}
            onClearFilters={handleClearFilters}
            onExport={handleExport}
            resultCount={filteredAttendances.length}
            totalCount={attendances.length}
          />

          {/* Main Table - Full Width */}
          <div>
            <TodayAttendanceTable
              attendances={paginatedAttendances}
              loading={loading}
              onViewDetail={handleViewDetail}
              onManualCheckIn={isAdmin ? handleManualCheckIn : undefined}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredAttendances.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>

          {/* Insights Card */}
          <AttendanceInsights
            totalEmployees={totalEmployees}
            present={presentCount}
            late={lateCount}
            absent={absentCount}
            notCheckedOut={notCheckedOutCount}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/attendance/history')}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <FileText size={20} className="text-blue-600" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-900">Lịch sử chấm công</h3>
              </div>
              <p className="text-sm text-slate-600">Xem lịch sử và báo cáo chi tiết theo tháng</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/attendance/corrections')}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <Settings size={20} className="text-orange-600" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-900">Điều chỉnh chấm công</h3>
              </div>
              <p className="text-sm text-slate-600">Phê duyệt yêu cầu điều chỉnh giờ làm</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/attendance/reports')}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <FileText size={20} className="text-emerald-600" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-slate-900">Báo cáo tháng</h3>
              </div>
              <p className="text-sm text-slate-600">Xuất báo cáo chấm công theo tháng</p>
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
