'use client';

import { useState, useEffect } from 'react';
import { terminationRequestService } from '@/services/terminationRequestService';
import { TerminationRequest, TERMINATION_CATEGORY_LABELS } from '@/types/termination-request';
import { toast } from '@/lib/toast';
import { formatDate } from '@/utils/formatDate';
import { FileText, Flame, CheckCircle, XCircle, Calendar, Clock, Building2, User } from 'lucide-react';

interface TerminationApprovalPanelProps {
    userId: string;
    onUpdate?: () => void;
    urgentOnly?: boolean;
}

export default function TerminationApprovalPanel({ userId, onUpdate, urgentOnly = false }: TerminationApprovalPanelProps) {
    const [requests, setRequests] = useState<TerminationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<TerminationRequest | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [approveComments, setApproveComments] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const data = await terminationRequestService.getPendingTerminations();
            setRequests(data || []);
        } catch (error) {
            console.error('Failed to fetch termination requests:', error);
            toast.error('Không thể tải danh sách yêu cầu chấm dứt hợp đồng');
            setRequests([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setActionLoading(true);

        try {
            await terminationRequestService.approveTermination(selectedRequest.id, {
                approverId: userId,
                comments: approveComments,
            });
            toast.success('Đã phê duyệt yêu cầu chấm dứt hợp đồng');
            setShowApproveModal(false);
            setApproveComments('');
            fetchPendingRequests();
            onUpdate?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể phê duyệt yêu cầu');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest || !rejectReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }
        setActionLoading(true);

        try {
            await terminationRequestService.rejectTermination(selectedRequest.id, {
                approverId: userId,
                reason: rejectReason,
            });
            toast.success('Đã từ chối yêu cầu chấm dứt hợp đồng');
            setShowRejectModal(false);
            setRejectReason('');
            fetchPendingRequests();
            onUpdate?.();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể từ chối yêu cầu');
        } finally {
            setActionLoading(false);
        }
    };

    const calculateDaysRemaining = (terminationDate: string) => {
        const today = new Date();
        const termDate = new Date(terminationDate);
        const diffTime = termDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white animate-pulse">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/2 mb-1"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="h-4 bg-gray-100 rounded"></div>
                            <div className="h-4 bg-gray-100 rounded"></div>
                            <div className="h-4 bg-gray-100 rounded"></div>
                            <div className="h-4 bg-gray-100 rounded"></div>
                        </div>
                        <div className="h-12 bg-gray-100 rounded mb-4"></div>
                        <div className="flex justify-end gap-3">
                            <div className="h-10 bg-gray-200 rounded w-24"></div>
                            <div className="h-10 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium mb-2">Không có yêu cầu chấm dứt hợp đồng nào đang chờ phê duyệt</p>
                <p className="text-slate-400 text-sm">Tất cả yêu cầu đã được xử lý</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => {
                const daysRemaining = calculateDaysRemaining(request.terminationDate);
                const isUrgent = daysRemaining <= 7;

                // Apply urgent filter
                if (urgentOnly && !isUrgent) {
                    return null;
                }

                return (
                    <div
                        key={request.id}
                        className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${isUrgent
                            ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100'
                            : 'border-slate-200 bg-white hover:border-blue-300'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-red-200' : 'bg-blue-100'
                                    }`}>
                                    <User className={isUrgent ? 'text-red-700' : 'text-blue-700'} size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {request.contract?.employee.fullName}
                                    </h3>
                                    <p className="text-sm text-slate-600 font-medium">
                                        {request.contract?.employee.employeeCode} • {request.contract?.employee.position}
                                    </p>
                                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                        <Building2 size={14} />
                                        {request.contract?.employee.department?.name}
                                    </div>
                                </div>
                            </div>
                            {isUrgent && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                                    <Flame size={14} />
                                    Khẩn cấp
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                    <FileText size={12} />
                                    Loại chấm dứt
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {TERMINATION_CATEGORY_LABELS[request.terminationCategory]}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Ngày thông báo
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {formatDate(request.noticeDate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                    <Calendar size={12} />
                                    Ngày chấm dứt
                                </p>
                                <p className="text-sm font-bold text-slate-900">
                                    {formatDate(request.terminationDate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-semibold mb-1 flex items-center gap-1">
                                    <Clock size={12} />
                                    Còn lại
                                </p>
                                <p className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-slate-900'}`}>
                                    {daysRemaining} ngày
                                </p>
                            </div>
                        </div>

                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-500 font-semibold mb-2">Lý do chấm dứt</p>
                            <p className="text-sm text-slate-700 leading-relaxed">{request.reason}</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectModal(true);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all font-semibold"
                            >
                                <XCircle size={18} />
                                Từ chối
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApproveModal(true);
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-semibold shadow-lg"
                            >
                                <CheckCircle size={18} />
                                Phê duyệt
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Phê duyệt yêu cầu chấm dứt hợp đồng</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Bạn có chắc chắn muốn phê duyệt yêu cầu chấm dứt hợp đồng của{' '}
                            <strong>{selectedRequest.contract?.employee.fullName}</strong>?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ghi chú (tùy chọn)
                            </label>
                            <textarea
                                value={approveComments}
                                onChange={(e) => setApproveComments(e.target.value)}
                                rows={3}
                                placeholder="Nhập ghi chú nếu có..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setApproveComments('');
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-semibold mb-4">Từ chối yêu cầu chấm dứt hợp đồng</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Vui lòng nhập lý do từ chối yêu cầu của{' '}
                            <strong>{selectedRequest.contract?.employee.fullName}</strong>
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={3}
                                required
                                placeholder="Nhập lý do từ chối..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                disabled={actionLoading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={actionLoading || !rejectReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
