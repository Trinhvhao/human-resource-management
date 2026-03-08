'use client';

import React, { useEffect, useState, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';
import { Plus, Edit, Trash2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import salaryComponentService, { SalaryComponent } from '@/services/salaryComponentService';

export default function SalaryStructurePage() {
    const { can } = usePermission();
    const [components, setComponents] = useState<SalaryComponent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string>('ALL');

    useEffect(() => {
        fetchComponents();
    }, []);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            const response = await salaryComponentService.getAll();
            setComponents(response.data);
        } catch (error) {
            console.error('Không thể tải cấu trúc lương:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredComponents = useMemo(() => components.filter(c => {
        if (selectedType === 'ALL') return true;
        return c.componentType === selectedType;
    }), [components, selectedType]);

    // Group components by employee for better display
    const groupedByEmployee = useMemo(() => filteredComponents.reduce((acc, component) => {
        const key = component.employee.id;
        if (!acc[key]) {
            acc[key] = {
                employee: component.employee,
                components: []
            };
        }
        acc[key].components.push(component);
        return acc;
    }, {} as Record<string, { employee: any; components: SalaryComponent[] }>), [filteredComponents]);

    const stats = useMemo(() => ({
        total: components.length,
        basic: components.filter(c => c.componentType === 'BASIC').length,
        allowance: components.filter(c => c.componentType === 'ALLOWANCE').length,
        bonus: components.filter(c => c.componentType === 'BONUS').length,
        totalAmount: components.reduce((sum, c) => sum + Number(c.amount), 0),
    }), [components]);

    const getTypeBadge = (type: string) => {
        const styles = {
            BASIC: 'bg-blue-100 text-blue-700',
            ALLOWANCE: 'bg-green-100 text-green-700',
            BONUS: 'bg-purple-100 text-purple-700',
        };

        const labels = {
            BASIC: 'Lương cơ bản',
            ALLOWANCE: 'Phụ cấp',
            BONUS: 'Thưởng',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[type as keyof typeof styles]}`}>
                {labels[type as keyof typeof labels]}
            </span>
        );
    };

    return (
        <ProtectedRoute requiredPermission="MANAGE_SALARY_COMPONENTS">
            <>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">Cấu trúc Lương</h1>
                            <p className="text-slate-500 mt-1">Quản lý lương cơ bản, phụ cấp và thưởng cố định</p>
                        </div>

                        {can('MANAGE_SALARY_COMPONENTS') && (
                            <button
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-2xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
                            >
                                <Plus size={20} />
                                Thêm thành phần
                            </button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="text-brandBlue" size={20} />
                                </div>
                                <p className="text-sm text-slate-600">Tổng thành phần</p>
                            </div>
                            <p className="text-3xl font-bold text-primary">{stats.total}</p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <DollarSign className="text-blue-600" size={20} />
                                </div>
                                <p className="text-sm text-slate-600">Lương cơ bản</p>
                            </div>
                            <p className="text-3xl font-bold text-blue-600">{stats.basic}</p>
                        </div>

                        <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="text-green-600" size={20} />
                                </div>
                                <p className="text-sm text-slate-600">Phụ cấp</p>
                            </div>
                            <p className="text-3xl font-bold text-green-600">{stats.allowance}</p>
                        </div>

                        <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <DollarSign size={20} />
                                </div>
                                <p className="text-sm text-white/80">Tổng giá trị</p>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedType('ALL')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'ALL'
                                    ? 'bg-brandBlue text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Tất cả ({stats.total})
                            </button>
                            <button
                                onClick={() => setSelectedType('BASIC')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'BASIC'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Lương cơ bản ({stats.basic})
                            </button>
                            <button
                                onClick={() => setSelectedType('ALLOWANCE')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'ALLOWANCE'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Phụ cấp ({stats.allowance})
                            </button>
                            <button
                                onClick={() => setSelectedType('BONUS')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedType === 'BONUS'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                Thưởng ({stats.bonus})
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Loại / Ghi chú</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mô tả</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Hiệu lực</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Số tiền</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700" colSpan={3}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="flex items-center justify-center">
                                                    <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredComponents.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <DollarSign size={48} className="text-slate-300 mx-auto mb-3" />
                                                <p className="text-slate-400 font-medium">Chưa có thành phần lương nào</p>
                                                <p className="text-sm text-slate-400 mt-1">Nhấn "Thêm thành phần" để bắt đầu</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        Object.values(groupedByEmployee).map((group) => (
                                            <React.Fragment key={group.employee.id}>
                                                {/* Employee Header Row */}
                                                <tr className="bg-slate-100">
                                                    <td colSpan={7} className="px-6 py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white font-bold">
                                                                    {group.employee.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-primary text-lg">{group.employee.fullName}</p>
                                                                    <p className="text-sm text-slate-600">
                                                                        {group.employee.employeeCode} • {group.employee.department?.name || 'Chưa có phòng ban'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-slate-500">Tổng cộng</p>
                                                                <p className="text-xl font-bold text-green-600">
                                                                    {formatCurrency(group.components.reduce((sum, c) => sum + Number(c.amount), 0))}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Component Rows */}
                                                {group.components.map((component, index) => (
                                                    <tr key={component.id} className={`hover:bg-slate-50 transition-colors ${index === group.components.length - 1 ? 'border-b-2 border-slate-300' : ''}`}>
                                                        <td className="px-6 py-3 pl-20">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1 h-8 bg-brandBlue rounded-full"></div>
                                                                <div>
                                                                    {getTypeBadge(component.componentType)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-sm text-slate-600">
                                                            {component.note || '-'}
                                                        </td>
                                                        <td className="px-6 py-3 text-center">
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(component.effectiveDate).toLocaleDateString('vi-VN')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="font-bold text-green-600">
                                                                {formatCurrency(Number(component.amount))}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3" colSpan={3}>
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    className="p-2 hover:bg-blue-50 rounded-lg text-brandBlue transition-colors"
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border-l-4 border-brandBlue p-4 rounded-r-lg">
                        <h4 className="text-sm font-semibold text-brandBlue mb-2">ℹ️ Lưu ý:</h4>
                        <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                            <li><strong>Lương cơ bản:</strong> Mỗi nhân viên chỉ có 1 lương cơ bản active</li>
                            <li><strong>Phụ cấp:</strong> Có thể có nhiều loại (ăn trưa, xăng xe, điện thoại...)</li>
                            <li><strong>Thưởng:</strong> Thưởng cố định hàng tháng (KPI, hiệu suất...)</li>
                            <li>Thay đổi sẽ có hiệu lực từ ngày được chỉ định</li>
                        </ul>
                    </div>
                </div>
            </>
        </ProtectedRoute>
    );
}
