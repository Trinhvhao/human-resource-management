'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, AlertTriangle, TrendingDown, DollarSign, Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import disciplineService from '@/services/disciplineService';
import employeeService from '@/services/employeeService';
import { Discipline, DisciplineType, CreateDisciplineData } from '@/types/discipline';
import { Employee } from '@/types/employee';
import { formatDate, formatCurrency } from '@/utils/formatters';

const disciplineTypeLabels: Record<DisciplineType, string> = {
  WARNING: 'Cảnh cáo',
  FINE: 'Phạt tiền',
  DEMOTION: 'Giáng chức',
  TERMINATION: 'Sa thải',
};

const disciplineTypeColors: Record<DisciplineType, string> = {
  WARNING: 'bg-yellow-100 text-yellow-700',
  FINE: 'bg-orange-100 text-orange-700',
  DEMOTION: 'bg-red-100 text-red-700',
  TERMINATION: 'bg-gray-900 text-white',
};

export default function DisciplinesPage() {
  const router = useRouter();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DisciplineType | 'ALL'>('ALL');
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();

  const [formData, setFormData] = useState<CreateDisciplineData>({
    employeeId: '',
    reason: '',
    disciplineType: 'WARNING',
    amount: 0,
    disciplineDate: new Date().toISOString().split('T')[0],
  });

  const [stats, setStats] = useState({
    total: 0,
    totalFines: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [disciplinesRes, employeesRes] = await Promise.all([
        disciplineService.getAll(),
        employeeService.getAll({ status: 'ACTIVE' }),
      ]);

      setDisciplines(disciplinesRes.data);
      setEmployees(employeesRes.data);

      // Calculate stats
      const total = disciplinesRes.data.length;
      const totalFines = disciplinesRes.data.reduce((sum: number, d: Discipline) => sum + Number(d.amount), 0);
      const thisMonth = disciplinesRes.data.filter((d: Discipline) => {
        const date = new Date(d.disciplineDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;

      setStats({ total, totalFines, thisMonth });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.employeeId || !formData.reason) {
      toast.warning('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const confirmed = await confirm({
      title: 'Xác nhận tạo kỷ luật',
      message: `Bạn có chắc muốn tạo kỷ luật "${disciplineTypeLabels[formData.disciplineType]}" cho nhân viên này?`,
      confirmText: 'Tạo kỷ luật',
      type: 'warning',
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await disciplineService.create(formData);
      closeModal();
      toast.success('Tạo kỷ luật thành công');
      setShowModal(false);
      setFormData({
        employeeId: '',
        reason: '',
        disciplineType: 'WARNING',
        amount: 0,
        disciplineDate: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create discipline:', error);
      let errorMessage = 'Tạo kỷ luật thất bại';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(errorMessage);
      setConfirmLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa kỷ luật này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await disciplineService.delete(id);
      closeModal();
      toast.success('Xóa thành công');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete discipline:', error);
      let errorMessage = 'Xóa thất bại';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast.error(errorMessage);
      setConfirmLoading(false);
    }
  };

  const filteredDisciplines = disciplines.filter((discipline) => {
    const matchSearch = discipline.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discipline.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || discipline.disciplineType === filterType;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <ConfirmDialog />
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Quản lý kỷ luật</h1>
            <p className="text-slate-500 mt-1">Theo dõi và quản lý kỷ luật nhân viên</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Tạo kỷ luật
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tổng kỷ luật</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tổng tiền phạt</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalFines)}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign size={32} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tháng này</p>
                <p className="text-4xl font-bold mt-2">{stats.thisMonth}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingDown size={32} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên nhân viên hoặc lý do..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DisciplineType | 'ALL')}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                <option value="ALL">Tất cả loại</option>
                {Object.entries(disciplineTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Disciplines List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Số tiền phạt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDisciplines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có kỷ luật nào
                    </td>
                  </tr>
                ) : (
                  filteredDisciplines.map((discipline) => (
                    <tr key={discipline.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-primary">{discipline.employee?.fullName}</p>
                          <p className="text-sm text-slate-500">{discipline.employee?.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{discipline.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${disciplineTypeColors[discipline.disciplineType]}`}>
                          {disciplineTypeLabels[discipline.disciplineType]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-red-600">{formatCurrency(Number(discipline.amount))}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{formatDate(discipline.disciplineDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(discipline.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-primary mb-6">Tạo kỷ luật mới</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhân viên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    <option value="">Chọn nhân viên</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employeeCode} - {emp.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loại kỷ luật <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.disciplineType}
                    onChange={(e) => setFormData({ ...formData, disciplineType: e.target.value as DisciplineType })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  >
                    {Object.entries(disciplineTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Nhập lý do kỷ luật..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số tiền phạt
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                    min="0"
                    step="1000"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Nhập số tiền (nếu có)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày kỷ luật <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.disciplineDate}
                    onChange={(e) => setFormData({ ...formData, disciplineDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Tạo kỷ luật
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
