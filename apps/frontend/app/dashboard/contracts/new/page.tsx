'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FileSignature, ArrowLeft, User, Calendar, DollarSign, FileText, Search, X } from 'lucide-react';
import contractService from '@/services/contractService';
import employeeService from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { toast } from '@/lib/toast';

function NewContractForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const employeeIdParam = searchParams.get('employeeId');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState({
        employeeId: employeeIdParam || '',
        contractType: 'PROBATION',
        workType: 'FULL_TIME',
        workHoursPerWeek: 40,
        startDate: '',
        endDate: '',
        salary: '',
        notes: '',
    });

    useEffect(() => {
        fetchEmployees();
        if (employeeIdParam && employees.length > 0) {
            const emp = employees.find(e => e.id === employeeIdParam);
            if (emp) {
                setSelectedEmployee(emp);
                setSearchQuery(`${emp.employeeCode} - ${emp.fullName}`);
            }
        }
    }, [employeeIdParam, employees.length]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEmployees(employees);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = employees.filter(emp =>
                emp.fullName.toLowerCase().includes(query) ||
                emp.employeeCode.toLowerCase().includes(query) ||
                emp.position.toLowerCase().includes(query) ||
                emp.email.toLowerCase().includes(query)
            );
            setFilteredEmployees(filtered);
        }
    }, [searchQuery, employees]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await employeeService.getWithoutActiveContract(100);
            if (response.success && response.data) {
                setEmployees(response.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch employees:', error);
            toast.error(error?.message || 'Không thể tải danh sách nhân viên');
        }
    };

    const handleSelectEmployee = (emp: Employee) => {
        setSelectedEmployee(emp);
        setFormData({ ...formData, employeeId: emp.id });
        setSearchQuery(`${emp.employeeCode} - ${emp.fullName}`);
        setShowDropdown(false);
    };

    const handleClearEmployee = () => {
        setSelectedEmployee(null);
        setFormData({ ...formData, employeeId: '' });
        setSearchQuery('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.employeeId || !formData.startDate || !formData.salary) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        try {
            setLoading(true);
            const response = await contractService.create({
                employeeId: formData.employeeId,
                contractType: formData.contractType as any,
                workType: formData.workType as any,
                workHoursPerWeek: formData.workHoursPerWeek,
                startDate: formData.startDate,
                endDate: formData.endDate || undefined,
                salary: parseFloat(formData.salary),
                notes: formData.notes || undefined,
            });

            if (response.success) {
                toast.success('Tạo hợp đồng thành công');
                router.push(`/dashboard/contracts/${response.data.id}`);
            }
        } catch (error: any) {
            console.error('Failed to create contract:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredPermission="MANAGE_CONTRACTS">
            <>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-4 font-medium"
                        >
                            <ArrowLeft size={20} />
                            Quay lại
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <FileSignature className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">Tạo hợp đồng mới</h1>
                                <p className="text-slate-600 text-sm">Tạo hợp đồng lao động cho nhân viên</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Employee Selection */}
                        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <User size={18} className="text-blue-600" />
                                <h2 className="text-base font-bold text-slate-900">Chọn nhân viên</h2>
                                <span className="text-red-500">*</span>
                            </div>

                            <div className="relative" ref={dropdownRef}>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Tìm kiếm nhân viên..."
                                        className="w-full pl-10 pr-10 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                        required
                                    />
                                    {selectedEmployee && (
                                        <button
                                            type="button"
                                            onClick={handleClearEmployee}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>

                                {showDropdown && filteredEmployees.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {filteredEmployees.slice(0, 50).map((emp) => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                onClick={() => handleSelectEmployee(emp)}
                                                className={`w-full px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 ${selectedEmployee?.id === emp.id ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                                        {emp.fullName.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-slate-900 text-sm truncate">{emp.fullName}</div>
                                                        <div className="text-xs text-slate-600 truncate">{emp.employeeCode} • {emp.position}</div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {showDropdown && searchQuery && filteredEmployees.length === 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-xl p-3 text-center text-slate-500 text-sm">
                                        Không tìm thấy nhân viên
                                    </div>
                                )}

                                {selectedEmployee && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                {selectedEmployee.fullName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-slate-900 text-sm">{selectedEmployee.fullName}</div>
                                                <div className="text-xs text-slate-600">{selectedEmployee.employeeCode} • {selectedEmployee.position}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {employees.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        💡 Hiển thị {employees.length} nhân viên chưa có hợp đồng hiệu lực
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Contract Details */}
                        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText size={18} className="text-purple-600" />
                                <h2 className="text-base font-bold text-slate-900">Thông tin hợp đồng</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Loại hợp đồng <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.contractType}
                                        onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                        required
                                    >
                                        <option value="PROBATION">Thử việc (≤60 ngày)</option>
                                        <option value="FIXED_TERM">Có thời hạn (12-36 tháng)</option>
                                        <option value="INDEFINITE">Không thời hạn</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Chế độ làm việc <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.workType}
                                        onChange={(e) => {
                                            const workType = e.target.value;
                                            setFormData({
                                                ...formData,
                                                workType,
                                                workHoursPerWeek: workType === 'FULL_TIME' ? 40 : 20
                                            });
                                        }}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                        required
                                    >
                                        <option value="FULL_TIME">Full-time (40h/tuần)</option>
                                        <option value="PART_TIME">Part-time</option>
                                    </select>
                                </div>

                                {formData.workType === 'PART_TIME' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                            Số giờ làm việc/tuần <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.workHoursPerWeek}
                                            onChange={(e) => setFormData({ ...formData, workHoursPerWeek: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                            min="1"
                                            max="39"
                                            placeholder="20"
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Ngày kết thúc {formData.contractType !== 'INDEFINITE' && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        required={formData.contractType !== 'INDEFINITE'}
                                        disabled={formData.contractType === 'INDEFINITE'}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Lương cơ bản (VNĐ) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            value={formData.salary}
                                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                            className="w-full pl-10 pr-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all text-sm"
                                            placeholder="10,000,000"
                                            min="0"
                                            step="100000"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white rounded-xl border-2 border-slate-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <FileText size={18} className="text-slate-600" />
                                    <h2 className="text-base font-bold text-slate-900">Ghi chú</h2>
                                </div>
                                <span className="text-xs text-slate-500">Không bắt buộc</span>
                            </div>

                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all resize-none text-sm"
                                placeholder="Ghi chú về hợp đồng, điều kiện đặc biệt..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold text-slate-700 text-sm"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <FileSignature size={18} />
                                        Tạo hợp đồng
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </>
        </ProtectedRoute>
    );
}

export default function NewContractPage() {
    return (
        <Suspense fallback={
            <>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Đang tải...</p>
                    </div>
                </div>
            </>
        }>
            <NewContractForm />
        </Suspense>
    );
}
