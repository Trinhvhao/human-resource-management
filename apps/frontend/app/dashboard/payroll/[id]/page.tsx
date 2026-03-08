'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Lock, Edit, Save, X } from 'lucide-react';
import payrollService from '@/services/payrollService';
import { Payroll, PayrollItem } from '@/types/payroll';
import { formatCurrency } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

export default function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const [payroll, setPayroll] = useState<Payroll | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const isHR = user?.role && ['ADMIN', 'HR_MANAGER'].includes(user.role);

  useEffect(() => {
    fetchPayroll();
  }, [id]);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getById(id);
      setPayroll(response.data);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
      alert('Không tìm thấy bảng lương');
      router.push('/dashboard/payroll/manage');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: PayrollItem) => {
    setEditingItem(item.id);
    setEditValues({
      allowances: Number(item.allowances),
      bonus: Number(item.bonus),
      deduction: Number(item.deduction),
      overtimeHours: Number(item.overtimeHours),
      notes: item.notes || '',
    });
  };

  const handleSave = async (itemId: string) => {
    try {
      await payrollService.updateItem(id, itemId, editValues);
      alert('Cập nhật thành công');
      setEditingItem(null);
      fetchPayroll();
    } catch (error: any) {
      console.error('Failed to update item:', error);
      alert(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleFinalize = async () => {
    if (!confirm('Bạn có chắc muốn chốt bảng lương? Sau khi chốt sẽ không thể chỉnh sửa.')) {
      return;
    }

    try {
      await payrollService.finalize(id);
      alert('Chốt bảng lương thành công');
      fetchPayroll();
    } catch (error: any) {
      console.error('Failed to finalize:', error);
      alert(error.response?.data?.message || 'Chốt bảng lương thất bại');
    }
  };

  if (loading || !payroll) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  const canEdit = isHR && payroll.status === 'DRAFT';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Bảng lương tháng {payroll.month}/{payroll.year}
              </h1>
              <p className="text-slate-500 mt-1">
                {payroll.items?.length || 0} nhân viên • {formatCurrency(Number(payroll.totalAmount))}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {payroll.status === 'DRAFT' && (
              <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                Nháp
              </span>
            )}
            {payroll.status === 'PENDING_APPROVAL' && (
              <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold">
                Chờ duyệt
              </span>
            )}
            {payroll.status === 'APPROVED' && (
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold">
                Đã duyệt
              </span>
            )}
            {payroll.status === 'REJECTED' && (
              <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold">
                Từ chối
              </span>
            )}
            {payroll.status === 'LOCKED' && (
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                Đã khóa
              </span>
            )}
            {canEdit && (
              <button
                onClick={handleFinalize}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Lock size={18} />
                Chốt bảng lương
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Tổng nhân viên</p>
            <p className="text-3xl font-bold text-primary">{payroll.items?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <p className="text-sm text-slate-600 mb-1">Tổng thu nhập</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(payroll.items?.reduce((sum, item) =>
                sum + Number(item.baseSalary) + Number(item.allowances) + Number(item.bonus) + Number(item.overtimePay), 0) || 0
              )}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-red-200">
            <p className="text-sm text-slate-600 mb-1">Tổng khấu trừ</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(payroll.items?.reduce((sum, item) =>
                sum + Number(item.insurance) + Number(item.tax) + Number(item.deduction), 0) || 0
              )}
            </p>
          </div>
          <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-xl p-6 text-white">
            <p className="text-sm text-white/80 mb-1">Thực chi</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(payroll.totalAmount))}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Nhân viên</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Lương CB</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Phụ cấp</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Thưởng</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Tăng ca</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Khấu trừ khác</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Bảo hiểm</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Thuế TNCN</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Thực lãnh</th>
                  {canEdit && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payroll.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-primary text-sm">{item.employee?.fullName}</p>
                        <p className="text-xs text-slate-500">{item.employee?.employeeCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(Number(item.baseSalary))}</td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editValues.allowances}
                          onChange={(e) => setEditValues({ ...editValues, allowances: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      ) : (
                        formatCurrency(Number(item.allowances))
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editValues.bonus}
                          onChange={(e) => setEditValues({ ...editValues, bonus: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      ) : (
                        formatCurrency(Number(item.bonus))
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600">{formatCurrency(Number(item.overtimePay))}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          value={editValues.deduction}
                          onChange={(e) => setEditValues({ ...editValues, deduction: Number(e.target.value) })}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      ) : (
                        formatCurrency(Number(item.deduction))
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">
                      {formatCurrency(Number(item.insurance))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">{formatCurrency(Number(item.tax))}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-green-600">{formatCurrency(Number(item.netSalary))}</span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-center">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSave(item.id)}
                              className="p-1 hover:bg-green-50 rounded text-green-600"
                              title="Lưu"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-1 hover:bg-red-50 rounded text-red-600"
                              title="Hủy"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 hover:bg-blue-50 rounded text-brandBlue"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
