'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { terminationRequestService } from '@/services/terminationRequestService';
import { TerminationRequest, TERMINATION_CATEGORY_LABELS } from '@/types/termination-request';
import { formatDate } from '@/utils/formatDate';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function TerminationAlertsWidget() {
    const router = useRouter();
    const [requests, setRequests] = useState<TerminationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [urgentCount, setUrgentCount] = useState(0);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const data = await terminationRequestService.getPendingTerminations();
            const requestsData = data || [];
            setRequests(requestsData.slice(0, 3)); // Show only top 3

            // Count urgent requests (≤7 days)
            const urgent = requestsData.filter((req) => {
                const daysRemaining = calculateDaysRemaining(req.terminationDate);
                return daysRemaining <= 7;
            });
            setUrgentCount(urgent.length);
        } catch (error) {
            console.error('Failed to fetch termination requests:', error);
            setRequests([]); // Set empty array on error
            setUrgentCount(0);
        } finally {
            setLoading(false);
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
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-5 bg-slate-100 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-slate-50 rounded"></div>
                        <div className="h-16 bg-slate-50 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!requests || requests.length === 0) {
        return (
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Yêu cầu chấm dứt HĐ</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✅ Không có yêu cầu
                    </span>
                </div>
                <p className="text-sm text-slate-500">Không có yêu cầu chấm dứt hợp đồng nào đang chờ phê duyệt</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Yêu cầu chấm dứt HĐ</h3>
                    {urgentCount > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center gap-1">
                            <AlertTriangle size={12} />
                            {urgentCount} khẩn cấp
                        </span>
                    )}
                </div>
                <button
                    onClick={() => router.push('/dashboard/contracts/terminations')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1"
                >
                    Xem tất cả
                    <ArrowRight size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {requests.map((request) => {
                    const daysRemaining = calculateDaysRemaining(request.terminationDate);
                    const isUrgent = daysRemaining <= 7;

                    return (
                        <div
                            key={request.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${isUrgent
                                ? 'border-red-300 bg-red-50 hover:bg-red-100'
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                                }`}
                            onClick={() => router.push('/dashboard/contracts/terminations')}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900">
                                        {request.contract?.employee.fullName}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        {request.contract?.employee.employeeCode} • {request.contract?.employee.position}
                                    </p>
                                </div>
                                {isUrgent && (
                                    <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                        🔥 Khẩn
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">
                                    {TERMINATION_CATEGORY_LABELS[request.terminationCategory]}
                                </span>
                                <div className="flex items-center gap-1 text-slate-700 font-medium">
                                    <Clock size={12} />
                                    <span className={isUrgent ? 'text-red-700 font-bold' : ''}>
                                        {daysRemaining} ngày
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {requests.length > 0 && (
                <button
                    onClick={() => router.push('/dashboard/contracts/terminations')}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors"
                >
                    Phê duyệt ngay ({requests.length})
                </button>
            )}
        </div>
    );
}
