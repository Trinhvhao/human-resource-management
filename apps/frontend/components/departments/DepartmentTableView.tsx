'use client';

import { Department } from '@/types/department';
import { Building2, Users, AlertCircle, TrendingUp, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface DepartmentTableViewProps {
  departments: Department[];
  onView: (id: string) => void;
  loading?: boolean;
}

// Helper: Get team capacity insight
const getTeamCapacityInsight = (employeeCount: number, hasManager: boolean) => {
  if (!hasManager && employeeCount > 0) {
    return { type: 'warning', text: 'Cần quản lý', icon: AlertCircle };
  }
  if (employeeCount === 0) {
    return { type: 'info', text: 'Trống', icon: AlertCircle };
  }
  if (employeeCount >= 20) {
    return { type: 'success', text: 'Đông đảo', icon: TrendingUp };
  }
  if (employeeCount >= 10) {
    return { type: 'success', text: 'Ổn định', icon: Shield };
  }
  return { type: 'neutral', text: 'Nhỏ', icon: Users };
};

export default function DepartmentTableView({ departments, onView, loading = false }: DepartmentTableViewProps) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white sticky top-0">
            <tr>
              {['Code', 'Name', 'Manager', 'Employees', 'Sub-depts', 'Insight', 'Status'].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-slate-100">
                <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                <td className="px-4 py-3"><div className="h-6 bg-slate-100 rounded-full w-24"></div></td>
                <td className="px-4 py-3"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Building2 size={64} className="mb-4" />
        <p className="text-lg font-medium">No departments found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white sticky top-0 shadow-lg">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Manager
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Employees
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Sub-depts
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Insight
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {departments.map((dept, index) => (
            <motion.tr
              key={dept.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onView(dept.id)}
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group border-b border-slate-100"
            >
              <td className="px-4 py-3 text-sm font-semibold text-brandBlue group-hover:underline">
                {dept.code}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                    <Building2 size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{dept.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {dept.manager ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/30">
                      {dept.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium">{dept.manager.fullName}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Not assigned</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-orange-600" />
                  <span className="text-sm font-bold text-slate-700">{dept._count?.employees || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Building2 size={14} className="text-brandBlue" />
                  <span className="text-sm font-bold text-slate-700">{dept._count?.children || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                {(() => {
                  const insight = getTeamCapacityInsight(dept._count?.employees || 0, !!dept.manager);
                  const InsightIcon = insight.icon;
                  const colorClasses = {
                    warning: 'bg-amber-50 text-amber-700 border-amber-200',
                    info: 'bg-slate-50 text-slate-600 border-slate-200',
                    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    neutral: 'bg-blue-50 text-blue-700 border-blue-200',
                  };
                  
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold ${colorClasses[insight.type as keyof typeof colorClasses]}`}>
                      <InsightIcon size={12} />
                      <span>{insight.text}</span>
                    </div>
                  );
                })()}
              </td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  dept.isActive 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
