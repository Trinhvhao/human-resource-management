'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, FileText, User, Calendar, DollarSign, Clock,
    Briefcase, Building2, Mail, Phone, Hash, AlertCircle,
    CheckCircle2, XCircle, FileCheck, Edit, History
} from 'lucide-react';
import contractService from '@/services/contractService';
import terminationRequestService from '@/services/terminationRequestService';
import { Contract } from '@/types/contract';
import { toast } from '@/lib/toast';
import TerminationRequestForm from '@/components/contracts/TerminationRequestForm';
import TerminationHistory from '@/components/contracts/TerminationHistory';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function ContractDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuthStore();

    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [pendingTermination, setPendingTermination] = useState<any>(null);
    const [loadingTermination, setLoadingTermination] = useState(false);

    useEffect(() => {
        if (id) {
            fetchContract();
            checkPendingTermination();
        }
    }, [id]);

    const fetchContract = async () => {
        try {
            setLoading(true);
            const response = await contractService.getById(id);
            if (response.success && response.data) {
                setContract(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch contract:', error);
            toast.error('Không thể tải thông tin hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    const checkPendingTermination = async () => {
        try {
            setLoadingTermination(true);
            const response = await terminationRequestService.getByContract(id);
            if (response.success && response.data) {
                // Find pending request
                const pending = response.data.find((req: any) => req.status === 'PENDING');
                setPendingTermination(pending || null);
            }
        } catch (error) {
            console.error('Failed to check termination:', error);
        } finally {
            setLoadingTermination(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { bg: string; text: string; label: string }> = {
            ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang hiệu lực' },
            EXPIRED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Hết hạn' },
            TERMINATED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã chấm dứt' },
        };
        const { bg, text, label } = config[status] || config.ACTIVE;
        return (
            <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${bg} ${text}`}>
                {label}
            </span>
        );
    };

    const getContractTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            PROBATION: 'Thử việc',
            FIXED_TERM: 'Có thời hạn',
            INDEFINITE: 'Không thời hạn',
        };
        return labels[type] || type;
    };

    const getWorkTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            FULL_TIME: 'Toàn thời gian',
            PART_TIME: 'Bán thời gian',
        };
        return labels[type] || type;
    };

    const calculateContractDuration = () => {
        if (!contract) return null;
        const start = new Date(contract.startDate);
        const end = contract.endDate ? new Date(contract.endDate) : new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        return { months, days, totalDays: diffDays };
    };

    const calculateDaysRemaining = () => {
        if (!contract?.endDate) return null;
        const today = new Date();
        const end = new Date(contract.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </>
        );
    }

    if (!contract) {
        return (
            <>
                <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium mb-4">Không tìm thấy hợp đồng</p>
                    <button
                        onClick={() => router.push('/dashboard/contracts')}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                        ← Quay lại danh sách
                    </button>
                </div>
            </>
        );
    }

    return (
        <ProtectedRoute requiredPermission="VIEW_CONTRACTS">
            <>
                <>
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div>
                            <button
                                onClick={() => router.push('/dashboard/contracts')}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium text-sm"
                            >
                                <ArrowLeft size={18} />
                                Quay lại danh sách
                            </button>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Chi tiết Hợp đồng</h1>
                                    <div className="flex items-center gap-3">
                                        <p className="text-slate-600">Số hợp đồng: <span className="font-bold text-slate-900">{contract.contractNumber}</span></p>
                                        <span className="text-slate-300">•</span>
                                        {getStatusBadge(contract.status)}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {contract.status === 'ACTIVE' && (
                                        <>
                                            {pendingTermination ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-2 border-amber-200 rounded-lg">
                                                    <Clock size={16} className="text-amber-600" />
                                                    <span className="text-sm font-semibold text-amber-900">
                                                        Đang chờ duyệt chấm dứt
                                                    </span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowTerminateModal(true)}
                                                    disabled={loadingTermination}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Tạo yêu cầu chấm dứt hợp đồng (cần phê duyệt)"
                                                >
                                                    Yêu cầu chấm dứt HĐ
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Alert if contract expiring soon */}
                        {contract.status === 'ACTIVE' && calculateDaysRemaining() !== null && calculateDaysRemaining()! <= 30 && calculateDaysRemaining()! > 0 && (
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-amber-900">Hợp đồng sắp hết hạn</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Hợp đồng này sẽ hết hạn trong <span className="font-bold">{calculateDaysRemaining()} ngày</span>.
                                        Vui lòng chuẩn bị gia hạn hoặc chấm dứt hợp đồng.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Alert if pending termination */}
                        {pendingTermination && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
                                <Clock className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-blue-900">Yêu cầu chấm dứt hợp đồng đang chờ phê duyệt</p>
                                        <button
                                            onClick={() => router.push('/dashboard/contracts/terminations')}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                                        >
                                            Xem chi tiết →
                                        </button>
                                    </div>
                                    <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                                        <div>
                                            <span className="text-blue-600">Loại:</span>
                                            <span className="ml-1 font-semibold text-blue-900">
                                                {pendingTermination.terminationCategory === 'RESIGNATION' ? 'Nghỉ việc' :
                                                    pendingTermination.terminationCategory === 'TERMINATION' ? 'Sa thải' :
                                                        pendingTermination.terminationCategory === 'CONTRACT_END' ? 'Hết hạn HĐ' :
                                                            pendingTermination.terminationCategory === 'RETIREMENT' ? 'Nghỉ hưu' : 'Khác'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600">Ngày chấm dứt:</span>
                                            <span className="ml-1 font-semibold text-blue-900">
                                                {new Date(pendingTermination.terminationDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-blue-600">Người yêu cầu:</span>
                                            <span className="ml-1 font-semibold text-blue-900">
                                                {pendingTermination.requestedBy?.fullName || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Contract Overview Card */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <p className="text-blue-100 text-sm mb-1">Loại hợp đồng</p>
                                            <h2 className="text-2xl font-bold">{getContractTypeLabel(contract.contractType)}</h2>
                                        </div>
                                        <FileText size={40} className="text-blue-200 opacity-50" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                            <p className="text-blue-100 text-xs mb-1">Mức lương</p>
                                            <p className="text-xl font-bold">{formatCurrency(contract.salary)}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                            <p className="text-blue-100 text-xs mb-1">Hình thức làm việc</p>
                                            <p className="text-lg font-semibold">{getWorkTypeLabel(contract.workType || 'FULL_TIME')}</p>
                                            {contract.workType === 'PART_TIME' && (
                                                <p className="text-sm text-blue-100 mt-1">{contract.workHoursPerWeek || 40} giờ/tuần</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Details */}
                                <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <FileCheck size={20} className="text-blue-600" />
                                        <h2 className="text-lg font-bold text-slate-900">Thông tin hợp đồng</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Ngày bắt đầu</label>
                                                <p className="text-slate-900 font-bold mt-1">{formatDate(contract.startDate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                                <Calendar size={18} className="text-red-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Ngày kết thúc</label>
                                                <p className="text-slate-900 font-bold mt-1">
                                                    {contract.endDate ? formatDate(contract.endDate) : <span className="text-slate-400">Không xác định</span>}
                                                </p>
                                            </div>
                                        </div>
                                        {calculateContractDuration() && (
                                            <div className="flex items-start gap-3 col-span-2">
                                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                    <Clock size={18} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium">Thời hạn hợp đồng</label>
                                                    <p className="text-slate-900 font-bold mt-1">
                                                        {calculateContractDuration()!.months > 0 && `${calculateContractDuration()!.months} tháng `}
                                                        {calculateContractDuration()!.days > 0 && `${calculateContractDuration()!.days} ngày`}
                                                        <span className="text-slate-500 font-normal text-sm ml-2">
                                                            ({calculateContractDuration()!.totalDays} ngày)
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {contract.endDate && contract.status === 'ACTIVE' && calculateDaysRemaining() !== null && (
                                            <div className="flex items-start gap-3 col-span-2">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${calculateDaysRemaining()! <= 7 ? 'bg-red-100' :
                                                    calculateDaysRemaining()! <= 30 ? 'bg-amber-100' : 'bg-blue-100'
                                                    }`}>
                                                    <AlertCircle size={18} className={
                                                        calculateDaysRemaining()! <= 7 ? 'text-red-600' :
                                                            calculateDaysRemaining()! <= 30 ? 'text-amber-600' : 'text-blue-600'
                                                    } />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium">Thời gian còn lại</label>
                                                    <p className={`font-bold mt-1 ${calculateDaysRemaining()! <= 7 ? 'text-red-600' :
                                                        calculateDaysRemaining()! <= 30 ? 'text-amber-600' : 'text-slate-900'
                                                        }`}>
                                                        {calculateDaysRemaining()! > 0 ? `${calculateDaysRemaining()} ngày` : 'Đã hết hạn'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Employee Info */}
                                <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <User size={20} className="text-purple-600" />
                                            <h2 className="text-lg font-bold text-slate-900">Thông tin nhân viên</h2>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/dashboard/employees/${contract.employeeId}`)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                        >
                                            Xem hồ sơ →
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                <Hash size={18} className="text-slate-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Mã nhân viên</label>
                                                <p className="text-slate-900 font-bold mt-1">{contract.employee?.employeeCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Họ và tên</label>
                                                <p className="text-slate-900 font-bold mt-1">{contract.employee?.fullName || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Briefcase size={18} className="text-green-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Chức vụ</label>
                                                <p className="text-slate-900 font-bold mt-1">{contract.employee?.position || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                <Building2 size={18} className="text-purple-600" />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 font-medium">Phòng ban</label>
                                                <p className="text-slate-900 font-bold mt-1">{contract.employee?.department?.name || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        {contract.employee?.email && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                                    <Mail size={18} className="text-amber-600" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium">Email</label>
                                                    <p className="text-slate-900 font-semibold mt-1 text-sm">{contract.employee.email}</p>
                                                </div>
                                            </div>
                                        )}
                                        {contract.employee?.phone && (
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                                    <Phone size={18} className="text-cyan-600" />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 font-medium">Số điện thoại</label>
                                                    <p className="text-slate-900 font-semibold mt-1">{contract.employee.phone}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {contract.notes && (
                                    <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                                        <h2 className="text-lg font-bold text-slate-900 mb-3">Ghi chú</h2>
                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                            <p className="text-slate-700 whitespace-pre-wrap">{contract.notes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Termination History */}
                                <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                                    <TerminationHistory contractId={id} />
                                </div>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Quick Stats */}
                                <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
                                    <h3 className="text-base font-bold text-slate-900 mb-4">Tổng quan</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-blue-600" />
                                                <span className="text-sm text-slate-600">Loại HĐ</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{getContractTypeLabel(contract.contractType)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <DollarSign size={16} className="text-green-600" />
                                                <span className="text-sm text-slate-600">Lương</span>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">{formatCurrency(contract.salary)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Briefcase size={16} className="text-purple-600" />
                                                <span className="text-sm text-slate-600">Hình thức</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{getWorkTypeLabel(contract.workType || 'FULL_TIME')}</span>
                                        </div>
                                        {contract.status === 'ACTIVE' && (
                                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                    <span className="text-sm text-slate-600">Trạng thái</span>
                                                </div>
                                                <span className="text-sm font-bold text-emerald-600">Đang hiệu lực</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="bg-white rounded-xl border-2 border-slate-200 p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <History size={18} className="text-slate-600" />
                                        <h3 className="text-base font-bold text-slate-900">Lịch sử</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 size={14} className="text-blue-600" />
                                                </div>
                                                {contract.updatedAt !== contract.createdAt && (
                                                    <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                                                )}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-sm font-bold text-slate-900">Hợp đồng được tạo</p>
                                                <p className="text-xs text-slate-500 mt-1">{formatDate(contract.createdAt)}</p>
                                            </div>
                                        </div>
                                        {contract.updatedAt !== contract.createdAt && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Edit size={14} className="text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Cập nhật gần nhất</p>
                                                    <p className="text-xs text-slate-500 mt-1">{formatDate(contract.updatedAt)}</p>
                                                </div>
                                            </div>
                                        )}
                                        {contract.status === 'TERMINATED' && contract.terminatedReason && (
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                    <XCircle size={14} className="text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">Đã chấm dứt</p>
                                                    <p className="text-xs text-slate-500 mt-1">{contract.terminatedReason}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {contract.status === 'ACTIVE' && (
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 p-5">
                                        <h3 className="text-base font-bold text-slate-900 mb-3">Thao tác</h3>
                                        {pendingTermination ? (
                                            <div className="space-y-3">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock size={16} className="text-blue-600" />
                                                        <p className="text-sm font-bold text-blue-900">Đang chờ phê duyệt</p>
                                                    </div>
                                                    <p className="text-xs text-blue-700">
                                                        Yêu cầu chấm dứt hợp đồng đã được gửi và đang chờ quản lý phê duyệt.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => router.push('/dashboard/contracts/terminations')}
                                                    className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all text-sm flex items-center justify-center gap-2"
                                                >
                                                    Xem trạng thái yêu cầu
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="bg-slate-100 border border-slate-200 rounded-lg p-3">
                                                    <p className="text-xs text-slate-600">
                                                        <span className="font-semibold">Lưu ý:</span> Việc chấm dứt hợp đồng cần được phê duyệt bởi quản lý.
                                                        Bạn sẽ tạo yêu cầu chấm dứt và chờ phê duyệt.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowTerminateModal(true)}
                                                    disabled={loadingTermination}
                                                    className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle size={16} />
                                                    Yêu cầu chấm dứt hợp đồng
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>

                {/* Terminate Modal - Outside DashboardLayout */}
                {showTerminateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                        <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto relative">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Yêu cầu chấm dứt hợp đồng</h3>
                            <TerminationRequestForm
                                contractId={id}
                                userId={user?.id || ''}
                                onSuccess={() => {
                                    setShowTerminateModal(false);
                                    fetchContract();
                                    checkPendingTermination();
                                }}
                                onCancel={() => setShowTerminateModal(false)}
                            />
                        </div>
                    </div>
                )}
            </>
        </ProtectedRoute>
    );
}
