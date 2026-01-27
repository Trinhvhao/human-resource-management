'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Award, TrendingUp, DollarSign, Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import rewardService from '@/services/rewardService';
import employeeService from '@/services/employeeService';
import { Reward, RewardType, CreateRewardData } from '@/types/reward';
import { Employee } from '@/types/employee';
import { formatDate, formatCurrency } from '@/utils/formatters';

const rewardTypeLabels: Record<RewardType, string> = {
  BONUS: 'Thưởng tiền',
  CERTIFICATE: 'Giấy khen',
  PROMOTION: 'Thăng chức',
  OTHER: 'Khác',
};

const rewardTypeColors: Record<RewardType, string> = {
  BONUS: 'bg-green-100 text-green-700',
  CERTIFICATE: 'bg-blue-100 text-blue-700',
  PROMOTION: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function RewardsPage() {
  const router = useRouter();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<RewardType | 'ALL'>('ALL');
  
  const [formData, setFormData] = useState<CreateRewardData>({
    employeeId: '',
    reason: '',
    amount: 0,
    rewardDate: new Date().toISOString().split('T')[0],
    rewardType: 'BONUS',
  });

  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsRes, employeesRes] = await Promise.all([
        rewardService.getAll(),
        employeeService.getAll({ status: 'ACTIVE' }),
      ]);
      
      setRewards(rewardsRes.data);
      setEmployees(employeesRes.data);
      
      // Calculate stats
      const total = rewardsRes.data.length;
      const totalAmount = rewardsRes.data.reduce((sum: number, r: Reward) => sum + Number(r.amount), 0);
      const thisMonth = rewardsRes.data.filter((r: Reward) => {
        const date = new Date(r.rewardDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length;
      
      setStats({ total, totalAmount, thisMonth });
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.employeeId || !formData.reason || formData.amount <= 0) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      await rewardService.create(formData);
      alert('Tạo khen thưởng thành công');
      setShowModal(false);
      setFormData({
        employeeId: '',
        reason: '',
        amount: 0,
        rewardDate: new Date().toISOString().split('T')[0],
        rewardType: 'BONUS',
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create reward:', error);
      alert(error.response?.data?.message || 'Tạo khen thưởng thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khen thưởng này?')) return;

    try {
      await rewardService.delete(id);
      alert('Xóa thành công');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete reward:', error);
      alert(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const filteredRewards = rewards.filter((reward) => {
    const matchSearch = reward.employee?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       reward.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'ALL' || reward.rewardType === filterType;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <DashboardLayout>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Quản lý khen thưởng</h1>
            <p className="text-slate-500 mt-1">Theo dõi và quản lý khen thưởng nhân viên</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Tạo khen thưởng
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tổng khen thưởng</p>
                <p className="text-4xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Award size={32} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tổng tiền thưởng</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalAmount)}</p>
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
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Tháng này</p>
                <p className="text-4xl font-bold mt-2">{stats.thisMonth}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp size={32} />
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
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as RewardType | 'ALL')}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
              >
                <option value="ALL">Tất cả loại</option>
                {Object.entries(rewardTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rewards List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Loại</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Số tiền</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRewards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có khen thưởng nào
                    </td>
                  </tr>
                ) : (
                  filteredRewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-primary">{reward.employee?.fullName}</p>
                          <p className="text-sm text-slate-500">{reward.employee?.employeeCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{reward.reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${rewardTypeColors[reward.rewardType]}`}>
                          {rewardTypeLabels[reward.rewardType]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-green-600">{formatCurrency(Number(reward.amount))}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{formatDate(reward.rewardDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(reward.id)}
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
              <h3 className="text-2xl font-bold text-primary mb-6">Tạo khen thưởng mới</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nhân viên <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
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
                    Loại khen thưởng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as RewardType })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  >
                    {Object.entries(rewardTypeLabels).map(([key, label]) => (
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    placeholder="Nhập lý do khen thưởng..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Số tiền thưởng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    placeholder="Nhập số tiền"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày khen thưởng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.rewardDate}
                    onChange={(e) => setFormData({ ...formData, rewardDate: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Tạo khen thưởng
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
