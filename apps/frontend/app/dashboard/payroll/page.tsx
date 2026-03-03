'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DollarSign, Download, Eye, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import payrollService from '@/services/payrollService';
import { useAuthStore } from '@/store/authStore';
import { PayrollItem, Payroll } from '@/types/payroll';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';

// Extended type to include parent payroll info
type PayrollItemWithPeriod = PayrollItem & {
  month?: number;
  year?: number;
  status?: string;
};
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function PayrollPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { can } = usePermission();
  const [payrolls, setPayrolls] = useState<PayrollItemWithPeriod[]>([]);
  const [filteredPayrolls, setFilteredPayrolls] = useState<PayrollItemWithPeriod[]>([]);
  const [stats, setStats] = useState({
    currentMonth: 0,
    lastMonth: 0,
    avgSalary: 0,
    ytd: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      // Use new API endpoint for employee payslips
      const payrollsRes = await payrollService.getMyPayslips();

      setPayrolls(payrollsRes.data);

      // Calculate stats from payroll items
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const currentMonthPayroll = payrollsRes.data.find((p: PayrollItemWithPeriod) => {
        return p.month === currentMonth && p.year === currentYear;
      });

      const lastMonthPayroll = payrollsRes.data.find((p: PayrollItemWithPeriod) => {
        return p.month === lastMonth && p.year === lastMonthYear;
      });

      const yearPayrolls = payrollsRes.data.filter((p: PayrollItemWithPeriod) => {
        return p.year === currentYear;
      });

      const calculatedStats = {
        currentMonth: Number(currentMonthPayroll?.netSalary || 0),
        lastMonth: Number(lastMonthPayroll?.netSalary || 0),
        avgSalary: yearPayrolls.length > 0 ? yearPayrolls.reduce((sum: number, p: PayrollItemWithPeriod) => sum + Number(p.netSalary), 0) / yearPayrolls.length : 0,
        ytd: yearPayrolls.reduce((sum: number, p: PayrollItemWithPeriod) => sum + Number(p.netSalary), 0),
      };

      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter payrolls based on selected year and status
  useEffect(() => {
    let filtered = payrolls;

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter(p => p.year === selectedYear);
    }

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(p => p.status === selectedStatus);
    }

    setFilteredPayrolls(filtered);
  }, [payrolls, selectedYear, selectedStatus]);

  // Get available years from payrolls
  const availableYears = useMemo(() => {
    const years = [...new Set(payrolls.map(p => p.year).filter((y): y is number => y !== undefined))].sort((a, b) => b - a);
    return years;
  }, [payrolls]);

  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      REJECTED: 'bg-red-100 text-red-700',
      LOCKED: 'bg-green-100 text-green-700',
    };

    const labels = {
      DRAFT: 'Nháp',
      PENDING_APPROVAL: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      LOCKED: 'Đã khóa',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  }, []);

  // Memoize payroll rows
  const payrollRows = useMemo(() => {
    return filteredPayrolls.map((payroll, index) => (
      <motion.tr
        key={payroll.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05 }}
        className="hover:bg-slate-50 transition-colors"
      >
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-primary">
            Tháng {payroll.month}/{payroll.year}
          </div>
          <div className="text-xs text-slate-500">
            {formatDate(payroll.createdAt)}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-slate-700">
          {formatCurrency(Number(payroll.baseSalary))}
        </td>
        <td className="px-6 py-4 text-sm text-green-600">
          +{formatCurrency(Number(payroll.allowances))}
        </td>
        <td className="px-6 py-4 text-sm text-blue-600">
          +{formatCurrency(Number(payroll.overtimePay))}
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-red-600">
              -{formatCurrency(Number(payroll.deduction) + Number(payroll.insurance) + Number(payroll.tax))}
            </span>
            <div className="text-xs text-slate-500 space-y-0.5">
              <div>• BH: {formatCurrency(Number(payroll.insurance))}</div>
              <div>• Thuế: {formatCurrency(Number(payroll.tax))}</div>
              {Number(payroll.deduction) > 0 && (
                <div>• Khác: {formatCurrency(Number(payroll.deduction))}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm font-bold text-green-600">
            {formatCurrency(Number(payroll.netSalary))}
          </span>
        </td>
        <td className="px-6 py-4">{payroll.status ? getStatusBadge(payroll.status) : '-'}</td>
        <td className="px-6 py-4">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => router.push(`/dashboard/my-payroll/${payroll.id}`)}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
              title="Xem chi tiết"
            >
              <Eye size={16} />
            </button>
            <button
              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
              title="Tải xuống"
            >
              <Download size={16} />
            </button>
          </div>
        </td>
      </motion.tr>
    ));
  }, [filteredPayrolls, getStatusBadge, router]);

  return (
    <ProtectedRoute requiredPermission="VIEW_DASHBOARD">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-secondary">Lương & Thưởng</h1>
            <p className="text-slate-500 mt-1">Xem phiếu lương và lịch sử trả lương của bạn</p>
          </div>

          {/* Current Month Salary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-2xl p-8 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white/70 text-sm">Lương tháng này (của tôi)</p>
                  <h2 className="text-2xl font-bold mt-1">
                    {new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <DollarSign size={32} />
                </div>
              </div>

              <div className="mb-6">
                <p className="text-white/70 text-sm mb-2">Thực lãnh</p>
                <p className="text-5xl font-bold">{formatCurrency(stats.currentMonth)}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-xs mb-1">Tháng trước (của tôi)</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.lastMonth)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-xs mb-1">Trung bình/tháng</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.avgSalary)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-white/70 text-xs mb-1">Tổng năm nay</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.ytd)}</p>
                </div>
              </div>

              {stats.currentMonth > stats.lastMonth && (
                <div className="mt-4 bg-green-400/20 rounded-lg p-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  <p className="text-sm">
                    Tăng <strong>{formatCurrency(stats.currentMonth - stats.lastMonth)}</strong> so với tháng trước
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Tổng phiếu lương', value: payrolls.length.toString(), color: 'blue', icon: Calendar },
              { label: 'Đã trả', value: payrolls.filter(p => p.status === 'LOCKED').length.toString(), color: 'green', icon: DollarSign },
              { label: 'Đang xử lý', value: payrolls.filter(p => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL').length.toString(), color: 'yellow', icon: AlertCircle },
              { label: 'Năm nay', value: formatCurrency(stats.ytd), color: 'purple', icon: TrendingUp },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`text-${stat.color}-600`} size={20} />
                    </div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Payroll History */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-primary">Lịch sử lương</h2>
                  <p className="text-sm text-slate-500 mt-1">Danh sách phiếu lương của bạn</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Năm</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brandBlue focus:border-transparent"
                  >
                    <option value="">Tất cả năm</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Trạng thái</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brandBlue focus:border-transparent"
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="DRAFT">Nháp</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Từ chối</option>
                    <option value="LOCKED">Đã khóa</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedYear(new Date().getFullYear());
                      setSelectedStatus('ALL');
                    }}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-brandBlue hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Đặt lại
                  </button>
                  <div className="text-sm text-slate-500 whitespace-nowrap">
                    {filteredPayrolls.length} / {payrolls.length} phiếu lương
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tháng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Lương cơ bản
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Phụ cấp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tăng ca
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Khấu trừ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Thực lãnh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full"></div></td>
                        <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                      </tr>
                    ))
                  ) : filteredPayrolls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                          <DollarSign size={48} className="text-slate-300 mb-3" />
                          <p className="text-slate-400 font-medium">
                            {payrolls.length === 0
                              ? 'Chưa có phiếu lương nào'
                              : 'Không tìm thấy phiếu lương phù hợp'}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {payrolls.length === 0
                              ? 'Phiếu lương sẽ được tạo vào đầu tháng'
                              : 'Thử thay đổi bộ lọc để xem kết quả khác'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    payrollRows
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border-l-4 border-brandBlue p-4 rounded-r-lg">
            <h4 className="text-sm font-semibold text-brandBlue mb-2">ℹ️ Thông tin về lương:</h4>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>Ngày trả lương: <strong>Ngày 5</strong> hàng tháng</li>
              <li>BHXH: <strong>10.5%</strong> trên lương cơ bản + phụ cấp (tối đa 36 triệu)</li>
              <li>Thuế TNCN: <strong>Lũy tiến 5-35%</strong> trên thu nhập chịu thuế</li>
              <li>Giảm trừ gia cảnh: <strong>11 triệu/người</strong></li>
              <li>Lương gộp = Lương cơ bản (theo ngày công) + Phụ cấp + Thưởng + Tăng ca - Phạt</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
