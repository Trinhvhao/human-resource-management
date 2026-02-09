'use client';

import { useState, useEffect } from 'react';
import { terminationRequestService } from '@/services/terminationRequestService';
import { TerminationRequest, TERMINATION_CATEGORY_LABELS } from '@/types/termination-request';
import { formatDate } from '@/utils/formatDate';

interface TerminationHistoryProps {
    contractId: string;
}

export default function TerminationHistory({ contractId }: TerminationHistoryProps) {
    const [requests, setRequests] = useState<TerminationRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTerminationHistory();
    }, [contractId]);

    const fetchTerminationHistory = async () => {
        try {
            const data = await terminationRequestService.getTerminationRequestsByContract(contractId);
            setRequests(data || []);
        } catch (error) {
            console.error('Failed to fetch termination history:', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_APPROVAL':
                return (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        ⏳ Chờ phê duyệt
                    </span>
                );
            case 'APPROVED':
                return (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✅ Đã phê duyệt
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        ❌ Đã từ chối
                    </span>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử yêu cầu chấm dứt hợp đồng</h3>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                    <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                                </div>
                                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="h-3 bg-gray-100 rounded"></div>
                                <div className="h-3 bg-gray-100 rounded"></div>
                            </div>
                            <div className="h-12 bg-gray-100 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Chưa có yêu cầu chấm dứt hợp đồng nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử yêu cầu chấm dứt hợp đồng</h3>

            {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {TERMINATION_CATEGORY_LABELS[request.terminationCategory]}
                            </p>
                            <p className="text-xs text-gray-500">
                                Tạo ngày {formatDate(request.createdAt)}
                            </p>
                        </div>
                        {getStatusBadge(request.status)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-xs text-gray-500">Ngày thông báo</p>
                            <p className="text-sm text-gray-900">{formatDate(request.noticeDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Ngày chấm dứt</p>
                            <p className="text-sm text-gray-900">{formatDate(request.terminationDate)}</p>
                        </div>
                    </div>

                    <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Lý do</p>
                        <p className="text-sm text-gray-700">{request.reason}</p>
                    </div>

                    {request.requester && (
                        <div className="mb-2">
                            <p className="text-xs text-gray-500">Người yêu cầu</p>
                            <p className="text-sm text-gray-700">{request.requester.email}</p>
                        </div>
                    )}

                    {request.status === 'APPROVED' && request.approver && (
                        <div className="border-t border-gray-200 pt-3 mt-3">
                            <p className="text-xs text-gray-500 mb-1">Phê duyệt bởi</p>
                            <p className="text-sm text-gray-700">{request.approver.email}</p>
                            {request.approvedAt && (
                                <p className="text-xs text-gray-500">
                                    Ngày phê duyệt: {formatDate(request.approvedAt)}
                                </p>
                            )}
                            {request.approverComments && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">Ghi chú</p>
                                    <p className="text-sm text-gray-700">{request.approverComments}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {request.status === 'REJECTED' && request.approver && (
                        <div className="border-t border-red-200 pt-3 mt-3 bg-red-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                            <p className="text-xs text-red-600 mb-1">Từ chối bởi</p>
                            <p className="text-sm text-red-700">{request.approver.email}</p>
                            {request.approvedAt && (
                                <p className="text-xs text-red-600">
                                    Ngày từ chối: {formatDate(request.approvedAt)}
                                </p>
                            )}
                            {request.rejectionReason && (
                                <div className="mt-2">
                                    <p className="text-xs text-red-600">Lý do từ chối</p>
                                    <p className="text-sm text-red-700">{request.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
