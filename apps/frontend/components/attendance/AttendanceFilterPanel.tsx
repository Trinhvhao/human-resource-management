'use client';

import { Search, X, Download, Calendar, Building2, Filter as FilterIcon, LayoutGrid } from 'lucide-react';

interface AttendanceFilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  departments: Array<{ id: string; name: string }>;
  activeFilterCount: number;
  onClearFilters: () => void;
  onExport?: () => void;
  resultCount: number;
  totalCount: number;
}

export default function AttendanceFilterPanel({
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  departments,
  activeFilterCount,
  onClearFilters,
  onExport,
  resultCount,
  totalCount,
}: AttendanceFilterPanelProps) {
  const statusOptions = [
    { value: 'all', label: 'Tất cả', color: 'slate' },
    { value: 'on-time', label: 'Đúng giờ', color: 'emerald' },
    { value: 'late', label: 'Đi muộn', color: 'orange' },
    { value: 'absent', label: 'Vắng mặt', color: 'red' },
    { value: 'not-checked-out', label: 'Chưa check-out', color: 'blue' },
  ];

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-sm transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Date Picker */}
          <div className="relative min-w-[180px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-sm transition-all"
            />
          </div>

          {/* Department Dropdown */}
          <div className="relative min-w-[200px]">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all appearance-none bg-white cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Export Button */}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-all"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 mr-1">
          <FilterIcon size={16} />
          <span>Trạng thái:</span>
        </div>
        
        {statusOptions.map((option) => {
          const isActive = statusFilter === option.value;
          
          const colorClasses = {
            slate: {
              active: 'bg-slate-700 text-white border-slate-700',
              inactive: 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50',
            },
            emerald: {
              active: 'bg-emerald-600 text-white border-emerald-600',
              inactive: 'bg-white text-emerald-700 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50',
            },
            orange: {
              active: 'bg-orange-600 text-white border-orange-600',
              inactive: 'bg-white text-orange-700 border-orange-300 hover:border-orange-400 hover:bg-orange-50',
            },
            red: {
              active: 'bg-red-600 text-white border-red-600',
              inactive: 'bg-white text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50',
            },
            blue: {
              active: 'bg-blue-600 text-white border-blue-600',
              inactive: 'bg-white text-blue-700 border-blue-300 hover:border-blue-400 hover:bg-blue-50',
            },
          };

          const classes = isActive
            ? colorClasses[option.color as keyof typeof colorClasses].active
            : colorClasses[option.color as keyof typeof colorClasses].inactive;

          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`px-3 py-1.5 rounded-lg border font-medium text-sm transition-all ${classes}`}
            >
              {option.label}
            </button>
          );
        })}

        {/* Clear Filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 font-medium text-sm transition-all ml-2"
          >
            <X size={14} />
            Xóa ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Result Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Hiển thị <span className="font-semibold text-slate-900">{resultCount}</span> / {totalCount} nhân viên
        </span>
        
        {resultCount !== totalCount && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-medium">
            Đã lọc {totalCount - resultCount}
          </span>
        )}
      </div>
    </div>
  );
}
