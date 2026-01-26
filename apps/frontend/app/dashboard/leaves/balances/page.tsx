'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Calendar, Users, TrendingUp, Edit, Play, History, Loader2 } from 'lucide-react';
import leaveService from '@/services/leaveService';
import { LeaveBalance } from '@/types/leave';

export default function LeaveBalancesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBalance, setEditBalance] = useState<LeaveBalance | null>(null);
  const [editAnnual, setEditAnnual] = useState(0);
  const [editSick, setEditSick] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, [selectedYear]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getAllBalances(selectedYear);
      setBalances(response.data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAccrual = async () => {
    if (!confirm('Bạn có chắc muốn chạy tích lũy phép cho tất cả nhân viên?')) return;

    try {
      setActionLoading(true);
      await leaveService.runAccrual();
      alert('Chạy tích lũy phép thành công');
      fetchBalances();
    } catch (error: any) {
      console.error('Failed to run accrual:', error);
      alert(error.response?.data?.message || 'Chạy tích lũy thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBalance = (balance: LeaveBalance) => {
    setEditBalance(balance);
    setEditAnnual(balance.annualLeave);
    setEditSick(balance.sickLeave);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editBalance) return;

    try {
      setActionLoading(true);
      await leaveService.updateBalance(editBalance.employeeId, selectedYear, editAnnual, editSick);
      alert('Cập nhật số dư phép thành công');
      setShowEditModal(false);
      fetchBalances();
    } catch (error: any) {
      console.error('Failed to update balance:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const totalEmployees = balances.length;
  const totalAnnualRemaining = balances.reduce((sum, b) => sum + (b.remainingAnnual ?? (b.annualLeave + b.carriedOver - b.usedAnnual)), 0);
  const totalSickRemaining = balances.reduce((sum, b) => sum + (b.remainingSick ?? (b.sickLeave - b.usedSick)), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Quản lý số dư phép</h1>
            <p className="text-slate-500 mt-1">Xem và cập nhật số dư phép của nhân viên</p>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
            >
              {[2024, 2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              onClick={handleRunAccrual}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Play size={18} />
              Chạy tích lũy phép
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <p className="text-white/80 text-sm">Tổng nhân viên</p>
            </div>
            <p className="text-4xl font-bold">{totalEmployees}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="text-green-600" size={24} />
              </div>
              <p className="text-slate-600 text-sm">Phép năm còn lại</p>
            </div>
            <p className="text-4xl font-bold text-primary">{totalAnnualRemaining}</p>
            <p className="text-slate-500 text-sm mt-2">ngày</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <p className="text-slate-600 text-sm">Phép bệnh còn lại</p>
            </div>
            <p className="text-4xl font-bold text-primary">{totalSickRemaining}</p>
            <p className="text-slate-500 text-sm mt-2">ngày</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phòng ban</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Phép năm</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Đã dùng</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Còn lại</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Phép bệnh</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Đã dùng</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Còn lại</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-brandBlue mx-auto" />
                    </td>
                  </tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  balances.map((balance) => {
                    const remainingAnnual = balance.remainingAnnual ?? (balance.annualLeave + balance.carriedOver - balance.usedAnnual);
                    const remainingSick = balance.remainingSick ?? (balance.sickLeave - balance.usedSick);

                    return (
                      <tr key={balance.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-primary">{balance.employee?.fullName}</p>
                            <p className="text-sm text-slate-500">{balance.employee?.employeeCode}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {balance.employee?.department?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-semibold">{balance.annualLeave + balance.carriedOver}</span>
                          {balance.carriedOver > 0 && (
                            <span className="text-xs text-green-600 ml-1">(+{balance.carriedOver})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">{balance.usedAnnual}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${remainingAnnual < 3 ? 'text-red-600' : 'text-green-600'}`}>
                            {remainingAnnual}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold">{balance.sickLeave}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{balance.usedSick}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold ${remainingSick < 5 ? 'text-red-600' : 'text-blue-600'}`}>
                            {remainingSick}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleEditBalance(balance)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-brandBlue"
                            title="Chỉnh sửa"
                          >
                            <Edit size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">Cập nhật số dư phép</h3>
            <p className="text-slate-600 mb-4">
              Nhân viên: <span className="font-semibold">{editBalance.employee?.fullName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phép năm (ngày)
                </label>
                <input
                  type="number"
                  value={editAnnual}
                  onChange={(e) => setEditAnnual(Number(e.target.value))}
                  min={0}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phép bệnh (ngày)
                </label>
                <input
                  type="number"
                  value={editSick}
                  onChange={(e) => setEditSick(Number(e.target.value))}
                  min={0}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="flex-1 px-6 py-3 bg-brandBlue text-white rounded-lg font-semibold hover:bg-brandBlue/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
