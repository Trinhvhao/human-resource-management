'use client';

import { X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ContractFilterState {
    statuses: string[];
    contractTypes: string[];
    departments: string[];
    expiring: boolean;
}

interface ContractFilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    filters: ContractFilterState;
    onFilterChange: (filters: ContractFilterState) => void;
    departments: Array<{ id: string; name: string }>;
}

export default function ContractFilterPanel({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    departments,
}: ContractFilterPanelProps) {
    const statuses = [
        { value: 'ACTIVE', label: 'Đang hiệu lực' },
        { value: 'EXPIRED', label: 'Hết hạn' },
        { value: 'TERMINATED', label: 'Đã chấm dứt' },
    ];

    const contractTypes = [
        { value: 'PROBATION', label: 'Thử việc' },
        { value: 'FIXED_TERM', label: 'Có thời hạn' },
        { value: 'INDEFINITE', label: 'Không thời hạn' },
    ];

    const toggleArrayFilter = (key: keyof ContractFilterState, value: string) => {
        const currentValues = filters[key] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange({ ...filters, [key]: newValues });
    };

    const clearFilters = () => {
        onFilterChange({
            statuses: [],
            contractTypes: [],
            departments: [],
            expiring: false,
        });
    };

    const activeFilterCount =
        filters.statuses.length +
        filters.contractTypes.length +
        filters.departments.length +
        (filters.expiring ? 1 : 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <Filter className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">Bộ lọc</h2>
                                        {activeFilterCount > 0 && (
                                            <p className="text-sm text-slate-600">{activeFilterCount} bộ lọc đang áp dụng</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-600" />
                                </button>
                            </div>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="p-6 space-y-6">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Trạng thái
                                </label>
                                <div className="space-y-2">
                                    {statuses.map((status) => (
                                        <label
                                            key={status.value}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.statuses.includes(status.value)}
                                                onChange={() => toggleArrayFilter('statuses', status.value)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{status.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Contract Type Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Loại hợp đồng
                                </label>
                                <div className="space-y-2">
                                    {contractTypes.map((type) => (
                                        <label
                                            key={type.value}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.contractTypes.includes(type.value)}
                                                onChange={() => toggleArrayFilter('contractTypes', type.value)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-3">
                                    Phòng ban
                                </label>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {departments.map((dept) => (
                                        <label
                                            key={dept.id}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.departments.includes(dept.id)}
                                                onChange={() => toggleArrayFilter('departments', dept.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Expiring Soon */}
                            <div>
                                <label className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filters.expiring}
                                        onChange={(e) => onFilterChange({ ...filters, expiring: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-orange-900 block">Sắp hết hạn</span>
                                        <span className="text-xs text-orange-700">Hợp đồng hết hạn trong 30 ngày</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
