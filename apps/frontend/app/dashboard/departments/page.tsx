'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Building2, Plus, Users, Crown, AlertCircle, TrendingUp, BarChart3, Layers } from 'lucide-react';
import departmentService from '@/services/departmentService';
import teamService from '@/services/teamService';
import { Department } from '@/types/department';
import { Team } from '@/types/team';
import { motion } from 'framer-motion';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';

// Components
import DepartmentFilterPanel from '@/components/departments/DepartmentFilterPanel';
import DepartmentViewSwitcher, { DepartmentViewType } from '@/components/departments/DepartmentViewSwitcher';
import DepartmentCardView from '@/components/departments/DepartmentCardView';
import DepartmentTableView from '@/components/departments/DepartmentTableView';
import DepartmentOrgView from '@/components/departments/DepartmentOrgView';

export default function DepartmentsPage() {
  const router = useRouter();
  const { can } = usePermission();

  // Data State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [currentView, setCurrentView] = useState<DepartmentViewType>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const [deptsRes, teamsRes] = await Promise.all([
        departmentService.getAll(),
        teamService.getAll()
      ]);
      setDepartments(deptsRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        dept.name.toLowerCase().includes(search) ||
        dept.code.toLowerCase().includes(search) ||
        dept.description?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter === 'active' && !dept.isActive) return false;
    if (statusFilter === 'inactive' && dept.isActive) return false;

    // Manager filter
    if (managerFilter === 'assigned' && !dept.managerId) return false;
    if (managerFilter === 'unassigned' && dept.managerId) return false;

    // Type filter
    const isCEO = dept.code === 'CEO' || dept.name.includes('Giám Đốc');
    const isMain = !dept.parentId && !isCEO;
    const isSub = !!dept.parentId;

    if (typeFilter === 'ceo' && !isCEO) return false;
    if (typeFilter === 'main' && !isMain) return false;
    if (typeFilter === 'sub' && !isSub) return false;

    return true;
  });

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (managerFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setManagerFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export departments');
  };

  return (
    <ProtectedRoute requiredPermission="VIEW_DEPARTMENTS">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Phòng ban</h1>
              <p className="text-slate-600">Quản lý cơ cấu tổ chức và phòng ban</p>
            </div>
            {can('MANAGE_DEPARTMENTS') && (
              <button
                onClick={() => router.push('/dashboard/departments/new')}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-semibold shadow-lg"
              >
                <Plus size={20} />
                Thêm phòng ban
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Building2 className="text-white" size={24} />
                </div>
                <div className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200">
                  <TrendingUp className="text-blue-600" size={14} />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Tổng phòng ban</p>
              <p className="text-3xl font-bold text-slate-900">{departments.length}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-green-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <span className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                  {Math.round((departments.filter(d => d.isActive).length / departments.length) * 100)}%
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Đang hoạt động</p>
              <p className="text-3xl font-bold text-slate-900">
                {departments.filter(d => d.isActive).length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Crown className="text-white" size={24} />
                </div>
                <div className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200">
                  <Layers className="text-purple-600" size={14} />
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Cấp cao</p>
              <p className="text-3xl font-bold text-slate-900">
                {departments.filter(d => !d.parentId).length}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="group bg-white rounded-xl p-6 border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={24} />
                </div>
                <span className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                  Teams
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Tổng teams</p>
              <p className="text-3xl font-bold text-slate-900">{teams.length}</p>
            </motion.div>
          </div>

          {/* Toolbar */}
          <DepartmentFilterPanel
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            managerFilter={managerFilter}
            onManagerChange={setManagerFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            onExport={handleExport}
            resultCount={filteredDepartments.length}
            totalCount={departments.length}
          />

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg"
          >
            {/* View Switcher */}
            <div className="px-6 py-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <DepartmentViewSwitcher
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            </div>

            {currentView === 'card' && (
              <div className="p-6 space-y-8">
                <DepartmentCardView
                  departments={filteredDepartments}
                  onView={(id) => router.push(`/dashboard/departments/${id}`)}
                  loading={loading}
                />

                {/* Teams Section */}
                {!loading && teams.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                          <Users className="text-white" size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">Teams</h2>
                          <p className="text-sm text-slate-600">
                            {teams.length} teams • {teams.reduce((sum, t) => sum + (t._count?.members || 0), 0)} thành viên
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push('/dashboard/teams')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Xem tất cả →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teams.map((team) => (
                        <motion.div
                          key={team.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                          className="group bg-white rounded-xl border-2 border-slate-200 hover:border-orange-300 hover:shadow-xl transition-all cursor-pointer overflow-hidden"
                        >
                          {/* Header with gradient */}
                          <div className="p-5 bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-slate-100">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
                                <Users size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-base text-slate-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                                  {team.name}
                                </h3>
                                <p className="text-sm text-slate-600 font-semibold">{team.code}</p>
                              </div>
                              {!team.isActive && (
                                <span className="px-2 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700 border border-red-200">
                                  Inactive
                                </span>
                              )}
                            </div>

                            {/* Type Badge */}
                            <span className="inline-block px-3 py-1 text-xs font-bold rounded-lg bg-white border-2 border-orange-200 text-orange-700">
                              {team.type === 'PERMANENT' ? '🏢 Cố định' : team.type === 'PROJECT' ? '🚀 Dự án' : '🔄 Liên chức năng'}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-5 space-y-4">
                            {/* Description */}
                            {team.description && (
                              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                                {team.description}
                              </p>
                            )}

                            {/* Members Count */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2 border-orange-100">
                              <Users className="text-orange-600" size={18} />
                              <span className="text-lg font-bold text-orange-600">{team._count?.members || 0}</span>
                              <span className="text-sm text-orange-600/80 font-medium">thành viên</span>
                            </div>

                            {/* Department */}
                            {team.department && (
                              <div className="pt-3 border-t-2 border-slate-100">
                                <p className="text-xs text-slate-500 font-semibold mb-1">PHÒNG BAN</p>
                                <p className="text-sm text-slate-900 font-bold">{team.department.name}</p>
                              </div>
                            )}

                            {/* Team Lead */}
                            {team.teamLead ? (
                              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                  {team.teamLead.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-500 uppercase">Team Lead</p>
                                  <p className="text-sm font-bold text-slate-900 truncate">{team.teamLead.fullName}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border-2 border-amber-200">
                                <AlertCircle size={16} className="text-amber-600" />
                                <span className="text-sm font-bold text-amber-700">Chưa có Team Lead</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'table' && (
              <DepartmentTableView
                departments={filteredDepartments}
                onView={(id) => router.push(`/dashboard/departments/${id}`)}
                loading={loading}
              />
            )}

            {currentView === 'org-structure' && (
              <div className="p-6">
                <DepartmentOrgView
                  departments={filteredDepartments}
                  teams={teams}
                  onView={(id) => router.push(`/dashboard/departments/${id}`)}
                />
              </div>
            )}
          </motion.div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
