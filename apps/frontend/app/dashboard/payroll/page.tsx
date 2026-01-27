'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DollarSign, Download, Eye, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import payrollService from '@/services/payrollService';
import { useAuthStore } from '@/store/authStore';
import { PayrollItem, Payroll } from '@/types/payroll';

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
  const [payrolls, setPayrolls] = useState<PayrollItemWithPeriod[]>([]);
  const [stats, setStats] = useState({
    currentMonth: 0,
    lastMonth: 0,
    avgSalary: 0,
    ytd: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      // Get all payrolls and extract items for current employee
      const payrollsRes = await payrollService.getAll();
      
      // Extract all payroll items for current employee from all payrolls
      const myPayrollItems: PayrollItemWithPeriod[] = [];
      payrollsRes.data.forEach((payroll: Payroll) => {
        if (payroll.items && Array.isArray(payroll.items)) {
          const myItems = payroll.items
            .filter((item: PayrollItem) => item.employeeId === user.employeeId)
            .map((item: PayrollItem) => ({
              ...item,
              month: payroll.month,
              year: payroll.year,
              status: payroll.status,
            }));
          myPayrollItems.push(...myItems);
        }
      });

      setPayrolls(myPayrollItems);
      
      // Calculate stats from payroll items
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      
      const currentMonthPayroll = myPayrollItems.find((p: PayrollItemWithPeriod) => {
        return p.month === currentMonth && p.year === currentYear;
      });
      
      const lastMonthPayroll = myPayrollItems.find((p: PayrollItemWithPeriod) => {
        return p.month === lastMonth && p.year === lastMonthYear;
      });
      
      const yearPayrolls = myPayrollItems.filter((p: PayrollItemWithPeriod) => {
        return p.year === currentYear;
      });
      
      const calculatedStats = {
        currentMonth: currentMonthPayroll?.netSalary || 0,
        lastMonth: lastMonthPayroll?.netSalary || 0,
        avgSalary: yearPayrolls.length > 0 ? yearPayrolls.reduce((sum: number, p: PayrollItemWithPeriod) => sum + p.netSalary, 0) / yearPayrolls.length : 0,
        ytd: yearPayrolls.reduce((sum: number, p: PayrollItemWithPeriod) => sum + p.netSalary, 0),
      };
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PROCESSING: 'bg-yellow-100 text-yellow-700',
      FINALIZED: 'bg-green-100 text-green-700',
      PAID: 'bg-blue-100 text-blue-700',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>
        {status === 'DRAFT' ? 'Nháp' :
          status === 'PROCESSING' ? 'Đang xử lý' :
            status === 'FINALIZED' ? 'Đã chốt' :
              status === 'PAID' ? 'Đã trả' : status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary">Lương & Thưởng</h1>
          <p className="text-slate-500 mt-1">Xem phiếu lương và lịch sử trả lương</p>
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
                <p className="text-white/70 text-sm">Lương tháng này</p>
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
                <p className="text-white/70 text-xs mb-1">Tháng trước</p>
                <p className="text-xl font-bold">{formatCurrency(stats.lastMonth)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-xs mb-1">Trung bình</p>
                <p className="text-xl font-bold">{formatCurrency(stats.avgSalary)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-xs mb-1">Tổng năm</p>
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
            { label: 'Đã trả', value: payrolls.filter(p => p.status === 'FINALIZED').length.toString(), color: 'green', icon: DollarSign },
            { label: 'Đang xử lý', value: payrolls.filter(p => p.status === 'DRAFT').length.toString(), color: 'yellow', icon: AlertCircle },
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
            <h2 className="text-xl font-bold text-primary">Lịch sử lương</h2>
            <p className="text-sm text-slate-500 mt-1">Danh sách phiếu lương 12 tháng gần đây</p>
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
                ) : payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      Chưa có phiếu lương nào
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll, index) => (
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
                      <td className="px-6 py-4 text-sm text-red-600">
                        -{formatCurrency(Number(payroll.deductions) + Number(payroll.socialInsurance) + Number(payroll.healthInsurance) + Number(payroll.unemploymentInsurance) + Number(payroll.personalIncomeTax))}
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
                            onClick={() => router.push(`/dashboard/payroll/${payroll.id}`)}
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
                  ))
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
            <li>BHXH: <strong>10.5%</strong> (tối đa 36 triệu)</li>
            <li>Thuế TNCN: <strong>Lũy tiến 5-35%</strong></li>
            <li>Giảm trừ gia cảnh: <strong>11 triệu/người</strong></li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
