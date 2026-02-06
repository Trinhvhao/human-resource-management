'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Building2, Users, ChevronDown, ChevronRight, Eye, Edit, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import departmentService from '@/services/departmentService';
import teamService from '@/services/teamService';
import { Department } from '@/types/department';
import { Team } from '@/types/team';

interface TreeNodeProps {
  department: Department;
  level: number;
  allTeams: Team[];
}

function TreeNode({ department, level, allTeams }: TreeNodeProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const hasChildren = department.children && department.children.length > 0;
  const hasTeams = department._count?.teams ? department._count.teams > 0 : false;
  const hasExpandable = hasChildren || hasTeams;
  
  // Filter teams for this department from preloaded data
  const departmentTeams = allTeams.filter(team => team.departmentId === department.id);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      {/* Department Node */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
        className="group"
        style={{ marginLeft: `${level * 40}px` }}
      >
        <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-brandBlue hover:shadow-md transition-all mb-3">
          {/* Expand/Collapse Button for Children or Teams */}
          {hasExpandable ? (
            <button
              onClick={handleExpand}
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-brandBlue to-blue-600 text-white hover:shadow-lg transition-all flex items-center justify-center flex-shrink-0"
            >
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            </div>
          )}

          {/* Department Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            level === 0 
              ? 'bg-gradient-to-br from-brandBlue to-brandLightBlue' 
              : level === 1
              ? 'bg-gradient-to-br from-secondary to-brandRed'
              : 'bg-gradient-to-br from-purple-500 to-pink-500'
          }`}>
            <Building2 className="text-white" size={24} />
          </div>

          {/* Department Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-primary">{department.name}</h3>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                {department.code}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Users size={14} />
                <span>{department._count?.employees || 0} nhân viên</span>
              </div>
              {hasTeams && department._count?.teams && (
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <UserCircle size={14} />
                  <span>{department._count.teams} team</span>
                </div>
              )}
              {department.manager && (
                <div className="text-sm text-slate-600">
                  Trưởng phòng: <span className="font-medium text-brandBlue">{department.manager.fullName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => router.push(`/dashboard/departments/${department.id}`)}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => router.push(`/dashboard/departments/${department.id}/edit`)}
              className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
              title="Chỉnh sửa"
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Teams */}
      <AnimatePresence>
        {isExpanded && departmentTeams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ marginLeft: `${(level + 1) * 40}px` }}
            className="space-y-2 mb-3"
          >
            {departmentTeams.map((team) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-sm transition-all"
              >
                {/* Team Icon */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="text-white" size={20} />
                </div>

                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-purple-900">{team.name}</h4>
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-700 text-xs rounded-full">
                      {team.code}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      team.type === 'PERMANENT' 
                        ? 'bg-green-100 text-green-700'
                        : team.type === 'PROJECT'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {team.type === 'PERMANENT' ? 'Cố định' : team.type === 'PROJECT' ? 'Dự án' : 'Liên chức năng'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-sm text-purple-700">
                      <Users size={12} />
                      <span>{team._count?.members || 0} thành viên</span>
                    </div>
                    {team.teamLead && (
                      <div className="text-sm text-purple-700">
                        Team Lead: <span className="font-medium">{team.teamLead.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Actions */}
                <button
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                  className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  title="Xem chi tiết team"
                >
                  <Eye size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children Departments */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {department.children!.map((child) => (
              <TreeNode key={child.id} department={child} level={level + 1} allTeams={allTeams} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrganizationTreePage() {
  const router = useRouter();
  const [tree, setTree] = useState<Department[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load both tree and all teams in parallel
      const [treeResponse, teamsResponse] = await Promise.all([
        departmentService.getOrganizationTree(),
        teamService.getAll()
      ]);
      setTree(treeResponse.data);
      setAllTeams(teamsResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const countTotalDepartments = (depts: Department[]): number => {
    return depts.reduce((total, dept) => {
      return total + 1 + (dept.children ? countTotalDepartments(dept.children) : 0);
    }, 0);
  };

  const countTotalEmployees = (depts: Department[]): number => {
    return depts.reduce((total, dept) => {
      return total + (dept._count?.employees || 0) + (dept.children ? countTotalEmployees(dept.children) : 0);
    }, 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl" style={{ marginLeft: `${i * 40}px` }}></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Sơ đồ tổ chức</h1>
            <p className="text-slate-500 mt-1">
              Cấu trúc phòng ban theo cấp bậc - {countTotalDepartments(tree)} phòng ban, {countTotalEmployees(tree)} nhân viên
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/departments')}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Xem dạng lưới
            </button>
            <button
              onClick={() => router.push('/dashboard/departments/new')}
              className="px-4 py-2 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg hover:shadow-lg transition-all"
            >
              Thêm phòng ban
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng phòng ban</p>
                <p className="text-2xl font-bold text-primary">{countTotalDepartments(tree)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng nhân viên</p>
                <p className="text-2xl font-bold text-primary">{countTotalEmployees(tree)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Building2 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Phòng ban cấp cao</p>
                <p className="text-2xl font-bold text-primary">{tree.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Tree */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          {tree.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-400">Chưa có phòng ban nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tree.map((dept) => (
                <TreeNode key={dept.id} department={dept} level={0} allTeams={allTeams} />
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h3 className="font-bold text-primary mb-4">Chú thích</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Phòng ban theo cấp:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brandBlue to-brandLightBlue"></div>
                  <span className="text-sm text-slate-600">Phòng ban cấp 1 (Cấp cao nhất)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-brandRed"></div>
                  <span className="text-sm text-slate-600">Phòng ban cấp 2</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500"></div>
                  <span className="text-sm text-slate-600">Phòng ban cấp 3+</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Teams:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <UserCircle className="text-white" size={20} />
                  </div>
                  <span className="text-sm text-slate-600">Teams thuộc phòng ban</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Cố định</span>
                  <span className="text-sm text-slate-600">Team cố định</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Dự án</span>
                  <span className="text-sm text-slate-600">Team dự án</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
