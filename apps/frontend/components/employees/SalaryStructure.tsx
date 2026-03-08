'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, Save, X } from 'lucide-react';
import salaryComponentService from '@/services/salaryComponentService';
import { SalaryComponent, ComponentType } from '@/types/salaryComponent';
import { formatCurrency } from '@/utils/formatters';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';

interface SalaryStructureProps {
  employeeId: string;
  canEdit?: boolean;
}

const componentTypeLabels: Record<ComponentType, string> = {
  BASIC: 'Lương cơ bản',
  ALLOWANCE: 'Phụ cấp',
  LUNCH: 'Phụ cấp ăn trưa',
  TRANSPORT: 'Phụ cấp xăng xe',
  PHONE: 'Phụ cấp điện thoại',
  HOUSING: 'Phụ cấp nhà ở',
  POSITION: 'Phụ cấp chức vụ',
  BONUS: 'Thưởng',
  OTHER: 'Khác',
};

const componentTypeColors: Record<ComponentType, string> = {
  BASIC: 'bg-blue-100 text-blue-700',
  ALLOWANCE: 'bg-teal-100 text-teal-700',
  LUNCH: 'bg-green-100 text-green-700',
  TRANSPORT: 'bg-purple-100 text-purple-700',
  PHONE: 'bg-orange-100 text-orange-700',
  HOUSING: 'bg-pink-100 text-pink-700',
  POSITION: 'bg-indigo-100 text-indigo-700',
  BONUS: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

export default function SalaryStructure({ employeeId, canEdit = false }: SalaryStructureProps) {
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [totalSalary, setTotalSalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    componentType: 'LUNCH' as ComponentType,
    amount: 0,
    note: '',
  });

  useEffect(() => {
    fetchSalaryStructure();
  }, [employeeId]);

  const fetchSalaryStructure = async () => {
    try {
      setLoading(true);
      const response = await salaryComponentService.getByEmployee(employeeId);
      setComponents(response.data.components);
      setTotalSalary(response.data.totalSalary);
    } catch (error) {
      console.error('Failed to fetch salary structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await salaryComponentService.create({
        employeeId,
        ...formData,
      });
      toast.success('Thêm thành phần lương thành công');
      setShowAddModal(false);
      setFormData({ componentType: 'LUNCH', amount: 0, note: '' });
      fetchSalaryStructure();
    } catch (error: any) {
      console.error('Failed to add component:', error);
      toast.error(error.response?.data?.message || 'Thêm thất bại');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await salaryComponentService.update(id, formData);
      toast.success('Cập nhật thành công');
      setEditingId(null);
      fetchSalaryStructure();
    } catch (error: any) {
      console.error('Failed to update component:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc muốn xóa thành phần lương này?',
      confirmText: 'Xóa',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await salaryComponentService.delete(id);
      closeModal();
      toast.success('Xóa thành công');
      fetchSalaryStructure();
    } catch (error: any) {
      console.error('Failed to delete component:', error);
      closeModal();
      toast.error(error.response?.data?.message || 'Xóa thất bại');
    }
  };

  const startEdit = (component: SalaryComponent) => {
    setEditingId(component.id);
    setFormData({
      componentType: component.componentType,
      amount: Number(component.amount),
      note: component.note || '',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <ConfirmDialog />
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-primary">Cấu trúc lương</h3>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-brandBlue/90 transition-colors"
          >
            <Plus size={18} />
            Thêm
          </button>
        )}
      </div>

      {/* Total Salary */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white mb-6">
        <p className="text-white/80 text-sm mb-1">Tổng lương</p>
        <p className="text-4xl font-bold">{formatCurrency(totalSalary)}</p>
      </div>

      {/* Components List */}
      <div className="space-y-3">
        {components.length === 0 ? (
          <p className="text-center text-slate-500 py-8">Chưa có thành phần lương nào</p>
        ) : (
          components.map((component) => (
            <div
              key={component.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {editingId === component.id ? (
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <select
                    value={formData.componentType}
                    onChange={(e) => setFormData({ ...formData, componentType: e.target.value as ComponentType })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(componentTypeLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Số tiền"
                  />
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Ghi chú"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${componentTypeColors[component.componentType]}`}>
                      {componentTypeLabels[component.componentType]}
                    </span>
                    <span className="text-sm text-slate-600">{component.note}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(Number(component.amount))}
                    </span>
                    {canEdit && (
                      <div className="flex gap-2">
                        {editingId === component.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(component.id)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(component)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-brandBlue"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(component.id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-6">Thêm thành phần lương</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.componentType}
                  onChange={(e) => setFormData({ ...formData, componentType: e.target.value as ComponentType })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                >
                  {Object.entries(componentTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                  placeholder="Nhập số tiền"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                  placeholder="Ghi chú (tùy chọn)"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAdd}
                className="flex-1 px-6 py-3 bg-brandBlue text-white rounded-lg font-semibold hover:bg-brandBlue/90 transition-colors"
              >
                Thêm
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ componentType: 'LUNCH', amount: 0, note: '' });
                }}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
