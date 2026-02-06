'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { 
  ArrowLeft, Edit, Trash2, Building2, Users, User, ChevronRight, TrendingUp, 
  Award, Target, Crown, UserPlus, UserMinus, FileText, History, 
  BarChart3, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Briefcase, Mail, Phone, MapPin, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import departmentService from '@/services/departmentService';
import teamService from '@/services/teamService';
import { Department } from '@/types/department';
import { Team } from '@/types/team';
import PerformanceDashboard from '@/components/departments/PerformanceDashboard';

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [department, setDepartment] = useState<Department | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'teams' | 'performance' | 'history'>('overview');

  useEffect(() => {
    fetchDepartment();
    fetchPerformance();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const [deptRes, teamsRes] = await Promise.all([
        departmentService.getById(id),
        teamService.getAll(id)
      ]);
      setDepartment(deptRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Failed to fetch department:', error);
      alert('Không tìm thấy phòng ban');
      router.push('/dashboard/departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      setPerformanceLoading(true);
      const res = await departmentService.getPerformance(id);
      setPerformanceData(res.data);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này? Hành động này không thể hoàn tác.')) return;

    try {
      await departmentService.delete(id);
      alert('Xóa phòng ban thành công');
      router.push('/dashboard/departments');
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      alert(error.response?.data?.message || 'Xóa phòng ban thất bại');
    }
  };

  const handleAppointManager = () => {
    router.push(`/dashboard/departments/${id}/edit`);
  };

  const handleTransferEmployee = () => {
    router.push(`/dashboard/employees?departmentId=${id}`);
  };

  const handleViewChangeRequests = () => {
    router.push('/dashboard/departments/change-requests');
  };

  const handleExportReport = async () => {
    try {
      alert('Đang xuất báo cáo...');
      // TODO: Implement export functionality
    } catch (error) {
      alert('Xuất báo cáo thất bại');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-10 bg-slate-200 rounded w-96"></div>
            <div className="grid grid-cols-4 gap-4 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-100 rounded-xl mt-6"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!department) return null;

  const actionButtons = [
    {
      icon: Crown,
      label: 'Bổ nhiệm trưởng phòng',
      description: 'Thay đổi người quản lý',
      bgColor: 'bg-[#f66600]',
      onClick: handleAppointManager,
    },
    {
      icon: UserPlus,
      label: 'Điều chuyển nhân viên',
      description: 'Thêm/chuyển nhân viên',
      bgColor: 'bg-[#00358F]',
      onClick: handleTransferEmployee,
    },
    {
      icon: History,
      label: 'Yêu cầu thay đổi',
      description: 'Xem lịch sử thay đổi',
      bgColor: 'bg-purple-600',
      onClick: handleViewChangeRequests,
    },
    {
      icon: FileText,
      label: 'Xuất báo cáo',
      description: 'Báo cáo chi tiết',
      bgColor: 'bg-[#10b981]',
      onClick: handleExportReport,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2.5 hover:bg-white rounded-xl transition-all border border-slate-200 hover:shadow-md"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 font-medium">Phòng ban</span>
              <ChevronRight size={16} className="text-slate-400" />
              <span className="font-bold text-slate-900">{department.name}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/departments/${id}/edit`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold shadow-sm hover:shadow-md"
            >
              <Edit size={18} />
              Chỉnh sửa
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <MoreVertical size={18} />
                Hành động
              </button>
              
              <AnimatePresence>
                {showActionMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                  >
                    <div className="p-2">
                      {actionButtons.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            action.onClick();
                            setShowActionMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-all group"
                        >
                          <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <action.icon className="text-white" size={18} />
                          </div>
                          <div className="text-left flex-1">
                            <p className="font-semibold text-slate-900 text-sm">{action.label}</p>
                            <p className="text-xs text-slate-500">{action.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 p-2">
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowActionMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                          <Trash2 className="text-red-600" size={18} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-red-600 text-sm">Xóa phòng ban</p>
                          <p className="text-xs text-red-500">Không thể hoàn tác</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 rounded-2xl p-8 mb-6 text-white shadow-2xl relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
                  <Building2 size={48} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-bold">{department.name}</h1>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                      department.isActive 
                        ? 'bg-green-400/30 text-green-50 border-2 border-green-300/50' 
                        : 'bg-red-400/30 text-red-50 border-2 border-red-300/50'
                    }`}>
                      {department.isActive ? '● Hoạt động' : '● Ngừng hoạt động'}
                    </span>
                  </div>
                  <p className="text-blue-100 font-bold text-xl mb-4">Mã: {department.code}</p>
                  {department.description && (
                    <p className="text-white/90 max-w-3xl leading-relaxed text-lg">{department.description}</p>
                  )}
                  {department.parent && (
                    <div className="mt-4 flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 inline-flex">
                      <Building2 size={16} />
                      <span className="text-sm font-medium">Trực thuộc:</span>
                      <span className="font-bold">{department.parent.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats in Header */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Users className="text-white/80" size={24} />
                  <ArrowUpRight className="text-green-300" size={16} />
                </div>
                <p className="text-3xl font-bold mb-1">{department._count?.employees || 0}</p>
                <p className="text-white/80 text-sm font-medium">Nhân viên</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="text-white/80" size={24} />
                  <CheckCircle2 className="text-blue-300" size={16} />
                </div>
                <p className="text-3xl font-bold mb-1">{department._count?.children || 0}</p>
                <p className="text-white/80 text-sm font-medium">Phòng ban con</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <Target className="text-white/80" size={24} />
                  <TrendingUp className="text-purple-300" size={16} />
                </div>
                <p className="text-3xl font-bold mb-1">{teams.length}</p>
                <p className="text-white/80 text-sm font-medium">Teams</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="text-white/80" size={24} />
                  <Clock className="text-orange-300" size={16} />
                </div>
                <p className="text-3xl font-bold mb-1">{performanceData?.attendanceRate || 0}%</p>
                <p className="text-white/80 text-sm font-medium">Chuyên cần</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-2 mb-6 border border-slate-200 shadow-sm"
        >
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Tổng quan', icon: Building2 },
              { id: 'employees', label: 'Nhân viên', icon: Users },
              { id: 'teams', label: 'Teams', icon: Target },
              { id: 'performance', label: 'Hiệu suất', icon: TrendingUp },
              { id: 'history', label: 'Lịch sử', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Manager Info */}
              {department.manager ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <Crown className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Trưởng phòng</h3>
                      <p className="text-sm text-slate-500">Người quản lý phòng ban</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                      {department.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-slate-900 mb-1">{department.manager.fullName}</h4>
                      <p className="text-orange-600 font-bold text-lg mb-3">{department.manager.position}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={16} className="text-slate-400" />
                          <span className="font-semibold">{department.manager.employeeCode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={16} className="text-slate-400" />
                          <span className="font-medium">{department.manager.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleAppointManager}
                      className="px-6 py-3 bg-white border-2 border-orange-300 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold shadow-sm"
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-300">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có trưởng phòng</h3>
                    <p className="text-slate-600 mb-4">Phòng ban này chưa được bổ nhiệm người quản lý</p>
                    <button
                      onClick={handleAppointManager}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                    >
                      <Crown size={18} className="inline mr-2" />
                      Bổ nhiệm trưởng phòng
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-departments */}
              {department.children && department.children.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Building2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Phòng ban trực thuộc</h3>
                      <p className="text-sm text-slate-500">{department.children.length} phòng ban con</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {department.children.map((child) => (
                      <motion.div
                        key={child.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push(`/dashboard/departments/${child.id}`)}
                        className="group p-5 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                            <Building2 className="text-blue-600" size={24} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{child.name}</p>
                            <p className="text-sm text-slate-500 font-semibold">{child.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{child._count?.employees || 0}</p>
                            <p className="text-xs text-slate-500 font-medium">nhân viên</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'employees' && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Users className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Danh sách nhân viên</h3>
                    <p className="text-sm text-slate-500">{department._count?.employees || 0} nhân viên</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleTransferEmployee}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    <UserPlus size={18} className="inline mr-2" />
                    Thêm nhân viên
                  </button>
                  {(department._count?.employees || 0) > 0 && (
                    <button
                      onClick={() => router.push(`/dashboard/employees?departmentId=${id}`)}
                      className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
              </div>

              {department.employees && department.employees.length > 0 ? (
                <div className="space-y-3">
                  {department.employees.slice(0, 10).map((employee, index) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                      className="group flex items-center gap-5 p-5 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-lg">{employee.fullName}</p>
                        <p className="text-blue-600 font-semibold">{employee.position}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <User size={14} />
                            <span className="font-medium">{employee.employeeCode}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail size={14} />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          employee.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {employee.status === 'ACTIVE' ? 'Đang làm việc' : 'Không hoạt động'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có nhân viên</h3>
                  <p className="text-slate-600 mb-6">Phòng ban này chưa có nhân viên nào</p>
                  <button
                    onClick={handleTransferEmployee}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                  >
                    <UserPlus size={18} className="inline mr-2" />
                    Thêm nhân viên đầu tiên
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Target className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Teams</h3>
                    <p className="text-sm text-slate-500">{teams.length} teams</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/dashboard/teams')}
                  className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                >
                  Xem tất cả
                </button>
              </div>

              {teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                      className="group p-5 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                            <Target className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{team.name}</p>
                            <p className="text-sm text-slate-500 font-semibold">{team.code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">{team._count?.members || 0}</p>
                          <p className="text-xs text-slate-500 font-medium">thành viên</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Target className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có team</h3>
                  <p className="text-slate-600">Phòng ban này chưa có team nào</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {performanceData ? (
                <PerformanceDashboard data={performanceData} loading={performanceLoading} />
              ) : (
                <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="text-slate-400" size={40} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Không có dữ liệu hiệu suất</h3>
                  <p className="text-slate-600">Dữ liệu hiệu suất sẽ được cập nhật sau</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <History className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Lịch sử thay đổi</h3>
                  <p className="text-sm text-slate-500">Theo dõi các thay đổi quan trọng</p>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <History className="text-slate-400" size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Chức năng đang phát triển</h3>
                <p className="text-slate-600 mb-6">Lịch sử thay đổi sẽ được cập nhật trong phiên bản tiếp theo</p>
                <button
                  onClick={handleViewChangeRequests}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-bold"
                >
                  Xem yêu cầu thay đổi
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
