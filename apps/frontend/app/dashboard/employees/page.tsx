'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Search, Filter, Plus, Download, X } from 'lucide-react';
import employeeService from '@/services/employeeService';
import departmentService from '@/services/departmentService';
import { Employee } from '@/types/employee';
import { Department } from '@/types/department';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';

// New Components
import EmployeeViewSwitcher, { ViewType } from '@/components/employees/EmployeeViewSwitcher';
import EmployeeFilterPanel, { FilterState } from '@/components/employees/EmployeeFilterPanel';
import QuickFilterChips from '@/components/employees/QuickFilterChips';
import EmployeeTableView from '@/components/employees/EmployeeTableView';
import EmployeeCardView from '@/components/employees/EmployeeCardView';
import EmployeeKanbanView from '@/components/employees/EmployeeKanbanView';
import EmployeeStatsBar from '@/components/employees/EmployeeStatsBar';
import ExportModal from '@/components/employees/ExportModal';

export default function EmployeesPage() {
  const router = useRouter();
  const { can } = usePermission();

  // Force component version - change this to force reload
  const COMPONENT_VERSION = 'v2.0.0';

  // Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0); // Real total from statistics
  const [statistics, setStatistics] = useState<any>(null); // Full statistics data
  const limit = 20;

  // UI State
  const [currentView, setCurrentView] = useState<ViewType>('table');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    positions: [],
    statuses: [],
    dateRange: {},
  });

  // Debounce search term - reduced to 300ms for faster response
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch departments and positions
  useEffect(() => {
    fetchDepartments();
    fetchPositions();
    fetchStatistics();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchPositions = async () => {
    // Extract unique positions from employees or fetch from API
    const uniquePositions = Array.from(new Set(employees.map(e => e.position)));
    setPositions(uniquePositions.length > 0 ? uniquePositions : [
      'Manager', 'Senior Developer', 'Developer', 'Designer', 'HR Specialist', 'Accountant'
    ]);
  };

  const fetchStatistics = async () => {
    try {
      const response = await employeeService.getStatistics();
      setTotalEmployees(response.data?.total || 0);
      setStatistics(response.data); // Store full statistics
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const timestamp = new Date().toISOString();
      console.log(`=== FETCH EMPLOYEES START [${timestamp}] ===`);
      console.log('COMPONENT VERSION:', COMPONENT_VERSION);
      console.log('Filters:', JSON.stringify(filters, null, 2));

      // Build API params with backend-supported filters
      const params: any = {
        page,
        limit: Math.min(limit, 100),
        search: debouncedSearch || undefined,
      };

      // Backend supports these filters directly
      if (filters.departments.length === 1) {
        params.departmentId = filters.departments[0];
      }

      if (filters.statuses.length === 1) {
        params.status = filters.statuses[0];
      }

      if (filters.positions.length === 1) {
        params.position = filters.positions[0];
      }

      console.log('API Params:', JSON.stringify(params, null, 2));

      const response = await employeeService.getAll(params);

      if (!response || !response.data) {
        console.error('Invalid response:', response);
        setEmployees([]);
        setTotal(0);
        return;
      }

      console.log('API Response:', response.data.length, 'employees');

      // Client-side filtering for multi-select (backend only supports single value)
      let filteredData = response.data;

      // Apply multi-department filter (if more than 1 selected)
      if (filters.departments.length > 1) {
        console.log('Client-side filtering by departments:', filters.departments);
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter(emp =>
          filters.departments.includes(emp.departmentId)
        );
        console.log(`Department filter: ${beforeCount} -> ${filteredData.length}`);
      }

      // Apply multi-position filter (if more than 1 selected)
      if (filters.positions.length > 1) {
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter(emp =>
          filters.positions.includes(emp.position)
        );
        console.log(`Position filter: ${beforeCount} -> ${filteredData.length}`);
      }

      // Apply multi-status filter (if more than 1 selected)
      if (filters.statuses.length > 1) {
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter(emp =>
          filters.statuses.includes(emp.status)
        );
        console.log(`Status filter: ${beforeCount} -> ${filteredData.length}`);
      }

      // Apply date range filter (backend doesn't support this)
      if (filters.dateRange?.from) {
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter(emp =>
          new Date(emp.startDate) >= new Date(filters.dateRange.from!)
        );
        console.log(`Date from filter: ${beforeCount} -> ${filteredData.length}`);
      }

      if (filters.dateRange?.to) {
        const beforeCount = filteredData.length;
        filteredData = filteredData.filter(emp =>
          new Date(emp.startDate) <= new Date(filters.dateRange.to!)
        );
        console.log(`Date to filter: ${beforeCount} -> ${filteredData.length}`);
      }

      console.log('Final filtered count:', filteredData.length);
      console.log('=== FETCH EMPLOYEES END ===');

      setEmployees(filteredData);
      setTotal(response.meta?.total || filteredData.length);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filters, COMPONENT_VERSION]);

  useEffect(() => {
    fetchEmployees();
    fetchPositions();
  }, [fetchEmployees]);

  const handleQuickFilter = (quickFilter: any) => {
    setFilters(prev => ({
      ...prev,
      ...quickFilter,
    }));
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      departments: [],
      positions: [],
      statuses: [],
      dateRange: {},
    });
    setSearchTerm('');
    setPage(1);
  };

  const hasDateRangeFilter = () => {
    return !!(filters.dateRange?.from || filters.dateRange?.to);
  };

  const activeFilterCount =
    filters.departments.length +
    filters.positions.length +
    filters.statuses.length +
    (hasDateRangeFilter() ? 1 : 0);

  const totalPages = Math.ceil(total / limit);

  return (
    <ProtectedRoute requiredPermission="VIEW_EMPLOYEES">
      <DashboardLayout>
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left side - Primary action */}
            {can('CREATE_EMPLOYEE') && (
              <button
                onClick={() => router.push('/dashboard/employees/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
              >
                <Plus size={20} />
                Thêm nhân viên
              </button>
            )}
          </div>

          {/* Stats Bar */}
          <EmployeeStatsBar
            employees={employees}
            departmentCount={departments.length}
            totalEmployees={totalEmployees}
            statistics={statistics}
          />

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4 shadow-lg">
            {/* Search & Actions Row */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brandBlue transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, mã NV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brandBlue/20 focus:border-brandBlue text-sm font-medium transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* View Switcher */}
              <EmployeeViewSwitcher
                currentView={currentView}
                onViewChange={setCurrentView}
              />

              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(true)}
                className={`
                flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all
                ${activeFilterCount > 0
                    ? 'bg-gradient-to-r from-brandBlue to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105'
                    : 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-brandBlue'
                  }
              `}
              >
                <Filter size={18} />
                Lọc
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-white text-brandBlue rounded-full text-xs font-bold shadow-md">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:text-green-700 transition-all font-semibold text-sm"
                title="Xuất danh sách ra Excel"
              >
                <Download size={18} />
                <span className="hidden lg:inline">Xuất</span>
              </button>
            </div>

            {/* Quick Filters */}
            <QuickFilterChips onFilterSelect={handleQuickFilter} />

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Bộ lọc đang áp dụng:</span>

                {filters.departments.map(deptId => {
                  const dept = departments.find(d => d.id === deptId);
                  return dept ? (
                    <span key={deptId} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {dept.name}
                      <button onClick={() => setFilters(prev => ({
                        ...prev,
                        departments: prev.departments.filter(d => d !== deptId)
                      }))}>
                        <X size={12} />
                      </button>
                    </span>
                  ) : null;
                })}

                {filters.positions.map(pos => (
                  <span key={pos} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {pos}
                    <button onClick={() => setFilters(prev => ({
                      ...prev,
                      positions: prev.positions.filter(p => p !== pos)
                    }))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {filters.statuses.map(status => (
                  <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {status}
                    <button onClick={() => setFilters(prev => ({
                      ...prev,
                      statuses: prev.statuses.filter(s => s !== status)
                    }))}>
                      <X size={12} />
                    </button>
                  </span>
                ))}

                <button
                  onClick={clearAllFilters}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium underline"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
            {currentView === 'table' && (
              <EmployeeTableView
                employees={employees}
                onView={(id) => router.push(`/dashboard/employees/${id}`)}
                loading={loading}
              />
            )}

            {currentView === 'card' && (
              <div className="p-4">
                <EmployeeCardView
                  employees={employees}
                  onView={(id) => router.push(`/dashboard/employees/${id}`)}
                />
              </div>
            )}

            {currentView === 'kanban' && (
              <div className="p-4">
                <EmployeeKanbanView
                  employees={employees}
                  onView={(id) => router.push(`/dashboard/employees/${id}`)}
                />
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && currentView !== 'kanban' && (
            <div className="flex items-center justify-between bg-white rounded-xl border-2 border-slate-200 px-5 py-4 shadow-lg">
              <p className="text-sm text-slate-600 font-medium">
                Hiển thị <span className="font-bold text-brandBlue">{(page - 1) * limit + 1}</span> đến{' '}
                <span className="font-bold text-brandBlue">{Math.min(page * limit, total)}</span> trong tổng số{' '}
                <span className="font-bold text-brandBlue">{total}</span> kết quả
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-brandBlue disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  Trước
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${page === pageNum
                        ? 'bg-gradient-to-r from-brandBlue to-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'border-2 border-slate-300 hover:bg-slate-50 hover:border-brandBlue'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 hover:border-brandBlue disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <EmployeeFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            departments={departments}
            positions={positions}
            onClose={() => setShowFilterPanel(false)}
          />
        )}

        {/* Export Modal */}
        {showExportModal && (
          <ExportModal
            filters={filters}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
