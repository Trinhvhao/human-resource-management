'use client';

import { Building2, Users, ChevronRight, AlertCircle, Crown, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';

interface DepartmentCardProps {
  department: any;
  onAssignManager?: (id: string) => void;
}

// Calculate department health status
const getDepartmentStatus = (dept: any) => {
  const hasManager = !!dept.managerId;
  const employeeCount = dept._count?.employees || 0;
  const childCount = dept._count?.children || 0;
  const isTeam = !!dept.parentId;

  if (isTeam) {
    if (hasManager) {
      return { status: 'healthy', label: 'Team Lead', color: 'purple', icon: Award };
    }
    return { status: 'action', label: 'Chưa có Lead', color: 'yellow', icon: AlertCircle };
  }

  if (!hasManager && employeeCount === 0) {
    return { status: 'risk', label: 'Rủi ro', color: 'red', icon: AlertCircle };
  }
  if (!hasManager) {
    return { status: 'action', label: 'Cần xử lý', color: 'yellow', icon: AlertCircle };
  }
  if (employeeCount === 0) {
    return { status: 'empty', label: 'Chưa có NV', color: 'gray', icon: Users };
  }
  return { status: 'healthy', label: 'Ổn định', color: 'green', icon: TrendingUp };
};

const getStatusStyles = (color: string) => {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return styles[color as keyof typeof styles] || styles.gray;
};

const getDepartmentType = (dept: any) => {
  const isCEO = dept.code === 'CEO' || dept.name.includes('Giám Đốc');
  if (isCEO) return { label: 'Ban Lãnh Đạo', color: 'secondary' };
  if (!dept.parentId) return { label: 'Phòng Ban', color: 'brandBlue' };
  return { label: 'Phòng Trực Thuộc', color: 'brandLightBlue' };
};

export default function DepartmentCard({ department, onAssignManager }: DepartmentCardProps) {
  const status = getDepartmentStatus(department);
  const type = getDepartmentType(department);
  const employeeCount = department._count?.employees || 0;
  const childCount = department._count?.children || 0;
  const StatusIcon = status.icon;
  const isCEO = type.label === 'Ban Lãnh Đạo';
  const hasManager = !!department.managerId;

  return (
    <div className={`group relative bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
      isCEO 
        ? 'border-secondary/20 hover:border-secondary hover:shadow-lg hover:shadow-secondary/10' 
        : type.color === 'brandBlue'
        ? 'border-slate-200 hover:border-brandBlue hover:shadow-lg hover:shadow-brandBlue/10'
        : 'border-slate-200 hover:border-brandBlue/50 hover:shadow-lg hover:shadow-brandBlue/5'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
            isCEO ? 'bg-secondary text-white' :
            type.color === 'brandBlue' ? 'bg-brandBlue text-white' :
            'bg-brandBlue/10 text-brandBlue'
          }`}>
            {isCEO ? <Crown size={20} /> : <Building2 size={20} />}
          </div>

          {/* Title & Code */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 mb-0.5 line-clamp-1">
              {department.name}
            </h3>
            <p className="text-sm text-slate-500 font-medium">{department.code}</p>
          </div>

          {/* Status Badge - Only show if no manager or inactive */}
          {(!hasManager || !department.isActive) && (
            <div className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border ${
              !hasManager 
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <AlertCircle size={11} />
              <span>{!hasManager ? 'Chưa có QL' : 'Inactive'}</span>
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
            isCEO 
              ? 'bg-secondary/10 text-secondary' 
              : type.color === 'brandBlue'
              ? 'bg-brandBlue/10 text-brandBlue'
              : 'bg-brandBlue/5 text-brandBlue'
          }`}>
            {type.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        {department.description && (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
            {department.description}
          </p>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100">
            <Users className="text-orange-600" size={16} />
            <span className="text-sm font-bold text-orange-900">{employeeCount}</span>
            <span className="text-sm text-orange-600">NV</span>
          </div>
          
          {childCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <Building2 className="text-blue-600" size={16} />
              <span className="text-sm font-bold text-blue-900">{childCount}</span>
              <span className="text-sm text-blue-600">Team</span>
            </div>
          )}
        </div>

        {/* Manager Info */}
        {department.manager ? (
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-9 h-9 rounded-full bg-brandBlue flex items-center justify-center text-white font-bold text-xs">
              {department.manager.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase">
                {type.label === 'Phòng Trực Thuộc' ? 'Trưởng phòng' : 'Quản lý'}
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">{department.manager.fullName}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <AlertCircle size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">Chưa có quản lý</span>
          </div>
        )}

        {/* Parent Department */}
        {department.parent && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-500">
              Thuộc: <span className="text-slate-700 font-semibold">{department.parent.name}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {!department.managerId && onAssignManager && (
            <button
              onClick={() => onAssignManager(department.id)}
              className="flex-1 px-3 py-2 text-sm font-semibold text-brandBlue bg-brandBlue/5 rounded-lg hover:bg-brandBlue/10 border border-brandBlue/20 transition-colors"
            >
              Bổ nhiệm
            </button>
          )}
          <Link
            href={`/dashboard/departments/${department.id}`}
            className="px-3 py-2 text-sm font-semibold text-white bg-brandBlue rounded-lg hover:bg-[#002870] transition-colors flex items-center gap-1"
          >
            Chi tiết
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
