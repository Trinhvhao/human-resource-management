'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Lock, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { Payroll } from '@/types/payroll';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';

export default function ManagePayrollPage() {
  const router = useRouter();
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getAll();
      setPayrolls(response.data);
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayroll = async () => {
    // Close the create modal first
    setShowCreateModal(false);

    const confirmed = await confirm({
      title: 'Xác nhận tạo bảng lương',
      message: `Bạn có chắc muốn tạo bảng lương tháng ${selectedMonth}/${selectedYear}? Quá trình này có thể mất vài phút.`,
      confirmText: 'Tạo bảng lương',
      type: 'info'
    });

    if (!confirmed) {
      // If cancelled, reopen the create modal
      setShowCreateModal(true);
      return;
    }

    try {
      setConfirmLoading(true);
      toast.info('Đang tạo bảng lương cho tất cả nhân viên... Vui lòng đợi.');

      const response = await payrollService.create({
        month: selectedMonth,
        year: selectedYear,
      });

      closeModal();
      toast.success(`Tạo bảng lương tháng ${selectedMonth}/${selectedYear} thành công! Đã tính lương cho ${response.data?.employeeCount || 0} nhân viên.`);
      fetchPayrolls();
    } catch (error: any) {
      console.error('Failed to create payroll:', error);
      closeModal();

      let errorMessage = 'Tạo bảng lương thất bại';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.statusCode === 408 || error?.message?.includes('timeout')) {
        errorMessage = 'Yêu cầu hết thời gian chờ. Vui lòng thử lại hoặc liên hệ quản trị viên.';
      }

      toast.error(errorMessage);
    }
  };

  const handleFinalize = async (id: string, month: number, year: number) => {
    const confirmed = await confirm({
      title: 'Xác nhận chốt bảng lương',
      message: `Bạn có chắc muốn chốt bảng lương tháng ${month}/${year}? Sau khi chốt sẽ không thể chỉnh sửa.`,
      confirmText: 'Chốt bảng lương',
      type: 'warning'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await payrollService.finalize(id);
      closeModal();
      toast.success('Chốt bảng lương thành công');
      fetchPayrolls();
    } catch (error: any) {
      console.error('Failed to finalize payroll:', error);
      closeModal();
      const errorMessage = error?.message || 'Chốt bảng lương thất bại';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
            Nháp
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            Đã duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            Từ chối
          </span>
        );
      case 'LOCKED':
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
            Đã khóa
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const stats = {
    total: payrolls.length,
    draft: payrolls.filter(p => p.status === 'DRAFT').length,
    finalized: payrolls.filter(p => p.status === 'LOCKED').length,
    totalAmount: payrolls.reduce((sum, p) => sum + Number(p.totalAmount), 0),
  };

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Quản lý Bảng lương</h1>
            <p className="text-slate-500 mt-1">Tạo và quản lý bảng lương hàng tháng</p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} />
            Tạo bảng lương
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-brandBlue" size={20} />
              </div>
              <p className="text-sm text-slate-600">Tổng bảng lương</p>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Users className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Nháp</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Lock className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Đã chốt</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.finalized}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <p className="text-sm text-white/80">Tổng chi</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Payroll List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Kỳ lương</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Số nhân viên</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Tổng chi</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Ngày tạo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Chưa có bảng lương nào
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-brandBlue" size={18} />
                          <span className="font-semibold text-primary">
                            Tháng {payroll.month}/{payroll.year}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-slate-700">
                          {payroll._count?.items || 0} người
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-green-600">
                          {formatCurrency(Number(payroll.totalAmount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(payroll.status)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">
                        {new Date(payroll.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/payroll/${payroll.id}`)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-brandBlue transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={18} />
                          </button>
                          {payroll.status === 'DRAFT' && (
                            <button
                              onClick={() => handleFinalize(payroll.id, payroll.month, payroll.year)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Chốt bảng lương"
                            >
                              <Lock size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">Tạo bảng lương mới</h3>
            <p className="text-slate-600 mb-6">Chọn tháng và năm để tạo bảng lương</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tháng
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Năm
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                >
                  {[2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Hệ thống sẽ tự động tính lương cho tất cả nhân viên active dựa trên:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                <li>Ngày công thực tế</li>
                <li>Giờ tăng ca đã duyệt</li>
                <li>Khen thưởng và kỷ luật</li>
                <li>Bảo hiểm và thuế TNCN</li>
              </ul>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreatePayroll}
                disabled={creating}
                className="flex-1 px-6 py-3 bg-brandBlue text-white rounded-lg font-semibold hover:bg-brandBlue/90 transition-colors disabled:opacity-50"
              >
                Tạo bảng lương
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
