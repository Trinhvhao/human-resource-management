'use client';

import { Search, X, Filter, Download, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface DepartmentFilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  managerFilter: string;
  onManagerChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  activeFilterCount: number;
  onClearFilters: () => void;
  onExport?: () => void;
  resultCount: number;
  totalCount: number;
}

export default function DepartmentFilterPanel({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  managerFilter,
  onManagerChange,
  typeFilter,
  onTypeChange,
  activeFilterCount,
  onClearFilters,
  onExport,
  resultCount,
  totalCount,
}: DepartmentFilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4 shadow-lg">
      {/* Search & Actions Row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brandBlue transition-colors" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban, mã..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-brandBlue/20 focus:border-brandBlue text-sm font-medium transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-brandBlue text-white shadow-lg shadow-brandBlue/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Lọc</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-white text-brandBlue rounded-full text-xs font-bold shadow-md">
                {activeFilterCount}
              </span>
            )}
          </button>

          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/30"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-brandBlue" />
            <span className="text-sm font-bold text-slate-700">Bộ lọc nâng cao</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all"
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {/* Manager Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Quản lý</label>
              <select
                value={managerFilter}
                onChange={(e) => onManagerChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all"
              >
                <option value="all">Tất cả</option>
                <option value="assigned">Đã có quản lý</option>
                <option value="unassigned">Chưa có quản lý</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Loại</label>
              <select
                value={typeFilter}
                onChange={(e) => onTypeChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue transition-all"
              >
                <option value="all">Tất cả</option>
                <option value="ceo">Ban lãnh đạo</option>
                <option value="main">Phòng ban chính</option>
                <option value="sub">Phòng trực thuộc</option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="w-full md:w-auto px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-200"
            >
              Xóa bộ lọc ({activeFilterCount})
            </button>
          )}
        </div>
      )}

      {/* Result Count */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
        <span className="text-slate-600 font-medium">
          Hiển thị <span className="font-bold text-brandBlue">{resultCount}</span> / {totalCount} phòng ban
        </span>
      </div>
    </div>
  );
}
