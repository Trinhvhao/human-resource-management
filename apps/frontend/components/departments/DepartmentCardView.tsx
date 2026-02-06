'use client';

import { Department } from '@/types/department';
import DepartmentCard from './DepartmentCard';
import DepartmentCardSkeleton from './DepartmentCardSkeleton';
import { Crown, Building2, Users } from 'lucide-react';

interface DepartmentCardViewProps {
  departments: Department[];
  onView: (id: string) => void;
  loading?: boolean;
}

export default function DepartmentCardView({ departments, onView, loading = false }: DepartmentCardViewProps) {
  // Show skeleton loading
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <DepartmentCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Separate by logic - ONLY departments, not teams
  const ceoDepartment = departments.find(d => d.code === 'CEO' || d.name.includes('Giám Đốc'));
  const mainDepartments = departments.filter(d => 
    !d.parentId && 
    d.code !== 'CEO' && 
    !d.name.includes('Giám Đốc')
  );
  const subDepartments = departments.filter(d => d.parentId);

  return (
    <div className="space-y-8">
      {/* CEO/Leadership */}
      {ceoDepartment && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <Crown className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ban Lãnh Đạo</h2>
              <p className="text-xs text-slate-500 font-medium">Cấp điều hành cao nhất</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div onClick={() => onView(ceoDepartment.id)}>
              <DepartmentCard department={ceoDepartment} />
            </div>
          </div>
        </div>
      )}

      {/* Main Departments */}
      {mainDepartments.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brandBlue flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Phòng Ban</h2>
              <p className="text-xs text-slate-500 font-medium">
                {mainDepartments.length} phòng ban • {mainDepartments.reduce((sum, d) => sum + (d._count?.employees || 0), 0)} nhân viên
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainDepartments.map((dept) => (
              <div key={dept.id} onClick={() => onView(dept.id)}>
                <DepartmentCard department={dept} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub Departments (if any exist in department structure) */}
      {subDepartments.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brandBlue/80 flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Phòng Ban Trực Thuộc</h2>
              <p className="text-xs text-slate-500 font-medium">
                {subDepartments.length} phòng ban • {subDepartments.reduce((sum, d) => sum + (d._count?.employees || 0), 0)} nhân viên
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subDepartments.map((dept) => (
              <div key={dept.id} onClick={() => onView(dept.id)}>
                <DepartmentCard department={dept} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && departments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Building2 className="text-slate-400" size={32} />
          </div>
          <p className="text-base font-semibold text-slate-700 mb-1">Không tìm thấy phòng ban</p>
          <p className="text-sm text-slate-500">Thử điều chỉnh bộ lọc hoặc tìm kiếm của bạn</p>
        </div>
      )}
    </div>
  );
}
