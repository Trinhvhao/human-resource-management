'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Eye, Clock, AlertCircle, Calendar, Users } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { Payroll } from '@/types/payroll';
import { formatCurrency } from '@/utils/formatters';

export default function PayrollApprovalsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

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

  const handleApprove = async (id: string, month: number, year: number) => {
    if (!confirm(`Bạn có chắc muốn duyệt bảng lương tháng ${month}/${year}?`)) {
      return;
    }

    try {
      await payrollService.approve(id, { notes: 'Đã duyệt' });
      alert('Duyệt bảng lương thành công');
      fetchPayrolls();
    } catch (error: any) {
      console.error('Failed to approve payroll:', error);
      alert(error.response?.data?.message || 'Duyệt bảng lương thất bại');
    }
  };

  const handleReject = async (id: string, month: number, year: number) => {
    const reason = prompt(`Lý do từ chối bảng lương tháng ${month}/${year}:`);
    if (!reason) return;

    try {
      await payrollService.reject(id, { reason });
      alert('Từ chối bảng lương thành công');
      fetchPayrolls();
    } catch (error: any) {
      console.error('Failed to reject payroll:', error);
      alert(error.response?.data?.message || 'Từ chối bảng lương thất bại');
    }
  };

  const filteredPayrolls = payrolls.filter(p => {
    if (selectedTab === 'pending') return p.status === 'PENDING_APPROVAL';
    if (selectedTab === 'approved') return p.status === 'APPROVED';
    if (selectedTab === 'rejected') return p.status === 'REJECTED';
    return false;
  });

  const stats = {
    pending: payrolls.filter(p => p.status === 'PENDING_APPROVAL').length,
    approved: payrolls.filter(p => p.status === 'APPROVED').length,
    rejected: payrolls.filter(p => p.status === 'REJECTED').length,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-secondary">Phê duyệt Bảng lương</h1>
          <p className="text-slate-500 mt-1">Duyệt hoặc từ chối các bảng lương đang chờ</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Chờ duyệt</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Đã duyệt</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Từ chối</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="border-b border-slate-200">
            <div className="flex gap-4 px-6">
              <button
                onClick={() => setSelectedTab('pending')}
                className={`py-4 px-4 font-semibold border-b-2 transition-colors ${selectedTab === 'pending'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                Chờ duyệt ({stats.pending})
              </button>
              <button
                onClick={() => setSelectedTab('approved')}
                className={`py-4 px-4 font-semibold border-b-2 transition-colors ${selectedTab === 'approved'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                Đã duyệt ({stats.approved})
              </button>
              <button
                onClick={() => setSelectedTab('rejected')}
                className={`py-4 px-4 font-semibold border-b-2 transition-colors ${selectedTab === 'rejected'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                Từ chối ({stats.rejected})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Kỳ lương</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Số NV</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Tổng chi</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Ngày gửi</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredPayrolls.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <AlertCircle size={48} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">
                        {selectedTab === 'pending' && 'Không có bảng lương nào chờ duyệt'}
                        {selectedTab === 'approved' && 'Chưa có bảng lương nào được duyệt'}
                        {selectedTab === 'rejected' && 'Chưa có bảng lương nào bị từ chối'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPayrolls.map((payroll) => (
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
                        <div className="flex items-center justify-center gap-1">
                          <Users size={16} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">
                            {payroll._count?.items || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-green-600">
                          {formatCurrency(Number(payroll.totalAmount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-slate-600">
                        {payroll.submittedAt
                          ? new Date(payroll.submittedAt).toLocaleDateString('vi-VN')
                          : '-'}
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
                          {selectedTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(payroll.id, payroll.month, payroll.year)}
                                className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                title="Duyệt"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleReject(payroll.id, payroll.month, payroll.year)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                title="Từ chối"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
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
    </>
  );
}
