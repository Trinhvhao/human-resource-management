'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Users, Plus, Search, X } from 'lucide-react';
import teamService from '@/services/teamService';
import departmentService from '@/services/departmentService';
import { Team } from '@/types/team';
import { Department } from '@/types/department';

export default function TeamsPage() {
  const router = useRouter();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, deptsRes] = await Promise.all([
        teamService.getAll(),
        departmentService.getAll()
      ]);
      setTeams(teamsRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredTeams = teams.filter(team => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        team.name.toLowerCase().includes(search) ||
        team.code.toLowerCase().includes(search) ||
        team.description?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    if (departmentFilter !== 'all' && team.departmentId !== departmentFilter) return false;
    if (typeFilter !== 'all' && team.type !== typeFilter) return false;

    return true;
  });

  const getTeamTypeLabel = (type: string) => {
    const labels = {
      PERMANENT: 'Cố định',
      PROJECT: 'Dự án',
      CROSS_FUNCTIONAL: 'Liên phòng ban'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTeamTypeBadge = (type: string) => {
    const styles = {
      PERMANENT: 'bg-blue-100 text-blue-700 border-blue-300',
      PROJECT: 'bg-purple-100 text-purple-700 border-purple-300',
      CROSS_FUNCTIONAL: 'bg-orange-100 text-orange-700 border-orange-300'
    };
    return styles[type as keyof typeof styles] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const activeFilterCount = 
    (departmentFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setDepartmentFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brandBlue via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Quản lý Teams
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Nhóm làm việc và phân công nhiệm vụ
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/teams/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue via-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} />
            Tạo Team
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brandBlue to-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Users size={24} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{teams.length}</p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Total Teams</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                <Users size={24} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {teams.filter(t => t.type === 'PERMANENT').length}
            </p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Permanent</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/30">
                <Users size={24} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {teams.filter(t => t.type === 'PROJECT').length}
            </p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Project</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border-2 border-orange-200 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30">
                <Users size={24} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {teams.reduce((sum, t) => sum + (t._count?.members || 0), 0)}
            </p>
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Total Members</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4 shadow-lg">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brandBlue transition-colors" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-brandBlue text-sm font-medium transition-all"
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filters:</span>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                departmentFilter !== 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-200'
              }`}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                typeFilter !== 'all'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                  : 'bg-slate-100 text-slate-700 border-2 border-slate-200'
              }`}
            >
              <option value="all">All Types</option>
              <option value="PERMANENT">Cố định</option>
              <option value="PROJECT">Dự án</option>
              <option value="CROSS_FUNCTIONAL">Liên phòng ban</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Clear ({activeFilterCount})
              </button>
            )}

            <div className="ml-auto text-sm text-slate-600 font-medium">
              {filteredTeams.length} / {teams.length} teams
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border-2 border-slate-200 p-5 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              </div>
            ))
          ) : filteredTeams.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Không tìm thấy team nào</p>
            </div>
          ) : (
            filteredTeams.map(team => (
              <div
                key={team.id}
                onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                className="bg-white rounded-xl border-2 border-slate-200 p-5 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{team.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{team.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 ${getTeamTypeBadge(team.type)}`}>
                    {getTeamTypeLabel(team.type)}
                  </span>
                </div>

                {team.description && (
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{team.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phòng ban:</span>
                    <span className="font-semibold text-slate-900">{team.department?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Team Lead:</span>
                    <span className="font-semibold text-slate-900">{team.teamLead?.fullName || 'Chưa có'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Thành viên:</span>
                    <span className="font-semibold text-blue-600">{team._count?.members || 0} người</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
