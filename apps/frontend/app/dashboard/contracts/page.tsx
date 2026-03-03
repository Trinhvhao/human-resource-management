'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Search, Filter, Plus, Download, FileSignature, X, AlertCircle } from 'lucide-react';
import contractService from '@/services/contractService';
import departmentService from '@/services/departmentService';
import { Contract } from '@/types/contract';
import { Department } from '@/types/department';
import { toast } from '@/lib/toast';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';

// Components
import ContractStatsBar from '@/components/contracts/ContractStatsBar';
import ContractFilterPanel, { ContractFilterState } from '@/components/contracts/ContractFilterPanel';

export default function ContractsPage() {
    const router = useRouter();
    const { can } = usePermission();

    // Data State
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    // UI State
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<ContractFilterState>({
        statuses: [],
        contractTypes: [],
        departments: [],
        expiring: false,
    });

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0,
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch departments
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch contracts when filters change
    useEffect(() => {
        fetchContracts();
    }, [debouncedSearch, filters, page]);

    // Fetch stats
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await departmentService.getAll();
            setDepartments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);

            // Build API params
            const params: any = {
                page,
                limit,
                search: debouncedSearch || undefined,
            };

            // Apply filters
            if (filters.statuses.length === 1) {
                params.status = filters.statuses[0];
            }
            if (filters.contractTypes.length === 1) {
                params.contractType = filters.contractTypes[0];
            }

            const response = await contractService.getAll(params);

            if (response.success && response.data) {
                let filteredData = Array.isArray(response.data) ? response.data : [];

                // Client-side filtering for multi-select
                if (filters.statuses.length > 1) {
                    filteredData = filteredData.filter(c => filters.statuses.includes(c.status));
                }
                if (filters.contractTypes.length > 1) {
                    filteredData = filteredData.filter(c => filters.contractTypes.includes(c.contractType));
                }
                if (filters.departments.length > 0) {
                    filteredData = filteredData.filter(c =>
                        filters.departments.includes(c.employee?.department?.id)
                    );
                }
                if (filters.expiring) {
                    const now = new Date();
                    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    filteredData = filteredData.filter(c => {
                        if (!c.endDate) return false;
                        const endDate = new Date(c.endDate);
                        return endDate >= now && endDate <= thirtyDaysLater;
                    });
                }

                setContracts(filteredData);
                setTotal(response.meta?.total || filteredData.length);
            }
        } catch (error) {
            console.error('Failed to fetch contracts:', error);
            toast.error('Không thể tải danh sách hợp đồng');
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, filters]);

    const fetchStats = async () => {
        try {
            const [allRes, expiringRes] = await Promise.all([
                contractService.getAll({ limit: 1000 }),
                contractService.getExpiring(30),
            ]);

            const allContracts = allRes.data || [];
            const active = allContracts.filter(c => c.status === 'ACTIVE').length;
            const expired = allContracts.filter(c => c.status === 'EXPIRED').length;
            const expiringSoon = expiringRes.data?.length || 0;

            setStats({
                total: allContracts.length,
                active,
                expired,
                expiringSoon,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const activeFilterCount =
        filters.statuses.length +
        filters.contractTypes.length +
        filters.departments.length +
        (filters.expiring ? 1 : 0);

    const clearFilters = () => {
        setFilters({
            statuses: [],
            contractTypes: [],
            departments: [],
            expiring: false,
        });
        setSearchTerm('');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800 border-green-200',
            EXPIRED: 'bg-red-100 text-red-800 border-red-200',
            TERMINATED: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        const labels: Record<string, string> = {
            ACTIVE: 'Đang hiệu lực',
            EXPIRED: 'Hết hạn',
            TERMINATED: 'Đã chấm dứt',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getContractTypeBadge = (type: string) => {
        const labels: Record<string, string> = {
            PROBATION: 'Thử việc',
            FIXED_TERM: 'Có thời hạn',
            INDEFINITE: 'Không thời hạn',
        };
        return (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                {labels[type] || type}
            </span>
        );
    };

    const getWorkTypeBadge = (workType: string, hours?: number) => {
        const labels: Record<string, string> = {
            FULL_TIME: 'Full-time',
            PART_TIME: 'Part-time',
        };
        const colors: Record<string, string> = {
            FULL_TIME: 'bg-green-100 text-green-800 border-green-200',
            PART_TIME: 'bg-orange-100 text-orange-800 border-orange-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[workType] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {labels[workType] || workType}
                {workType === 'PART_TIME' && hours && ` (${hours}h/tuần)`}
            </span>
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    return (
        <ProtectedRoute requiredPermission="VIEW_CONTRACTS">
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <FileSignature className="text-white" size={24} />
                                </div>
                                Quản lý Hợp đồng
                            </h1>
                            <p className="text-slate-600">Quản lý hợp đồng lao động của nhân viên</p>
                        </div>
                        {can('MANAGE_CONTRACTS') && (
                            <button
                                onClick={() => router.push('/dashboard/contracts/new')}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-semibold shadow-lg"
                            >
                                <Plus size={20} />
                                Tạo hợp đồng mới
                            </button>
                        )}
                    </div>

                    {/* Stats Bar */}
                    <ContractStatsBar
                        total={stats.total}
                        active={stats.active}
                        expired={stats.expired}
                        expiringSoon={stats.expiringSoon}
                    />

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo số HĐ, nhân viên..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/dashboard/contracts/terminations')}
                                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all font-semibold text-orange-700"
                            >
                                <AlertCircle size={20} />
                                <span className="hidden sm:inline">Chấm dứt HĐ</span>
                            </button>

                            <button
                                onClick={() => setShowFilterPanel(true)}
                                className={`
                flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all
                ${activeFilterCount > 0
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300'
                                    }
              `}
                            >
                                <Filter size={20} />
                                <span>Lọc</span>
                                {activeFilterCount > 0 && (
                                    <span className="px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => {/* TODO: Export */ }}
                                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all font-semibold text-slate-700"
                            >
                                <Download size={20} />
                                <span className="hidden sm:inline">Xuất</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Filters */}
                    {activeFilterCount > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-600">Đang lọc:</span>
                            {filters.statuses.map(status => (
                                <span key={status} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                    {status}
                                </span>
                            ))}
                            {filters.contractTypes.map(type => (
                                <span key={type} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                                    {type}
                                </span>
                            ))}
                            {filters.expiring && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                                    Sắp hết hạn
                                </span>
                            )}
                            <button
                                onClick={clearFilters}
                                className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                Xóa tất cả
                            </button>
                        </div>
                    )}

                    {/* Contracts Table */}
                    <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p className="text-slate-600 font-medium">Đang tải...</p>
                            </div>
                        ) : contracts.length === 0 ? (
                            <div className="p-12 text-center">
                                <FileSignature className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium mb-2">Không có hợp đồng nào</p>
                                <p className="text-slate-400 text-sm">Thử thay đổi bộ lọc hoặc tạo hợp đồng mới</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Số HĐ</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Nhân viên</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Loại HĐ</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Hình thức</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Ngày bắt đầu</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Ngày kết thúc</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {contracts.map((contract) => (
                                            <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-900">{contract.contractNumber}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900">{contract.employee.fullName}</div>
                                                        <div className="text-xs text-slate-500">{contract.employee.position}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getContractTypeBadge(contract.contractType)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getWorkTypeBadge(contract.workType, contract.workHoursPerWeek)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                                    {formatDate(contract.startDate)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                                    {contract.endDate ? formatDate(contract.endDate) : <span className="text-slate-400">Không xác định</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {getStatusBadge(contract.status)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline text-sm"
                                                    >
                                                        Chi tiết →
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && contracts.length > 0 && (
                        <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-slate-200">
                            <div className="text-sm text-slate-600 font-medium">
                                Hiển thị <span className="font-bold text-slate-900">{(page - 1) * limit + 1}</span> - <span className="font-bold text-slate-900">{Math.min(page * limit, total)}</span> trong tổng số <span className="font-bold text-slate-900">{total}</span> hợp đồng
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(prev => prev - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-slate-700 transition-all"
                                >
                                    ← Trước
                                </button>
                                <button
                                    onClick={() => setPage(prev => prev + 1)}
                                    disabled={page * limit >= total}
                                    className="px-4 py-2 border-2 border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-slate-700 transition-all"
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter Panel */}
                    <ContractFilterPanel
                        isOpen={showFilterPanel}
                        onClose={() => setShowFilterPanel(false)}
                        filters={filters}
                        onFilterChange={setFilters}
                        departments={departments}
                    />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
