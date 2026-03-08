'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import leaveService from '@/services/leaveService';
import { LeaveRequest } from '@/types/leave';
import { formatDate } from '@/utils/formatters';

export default function PendingLeavesPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            const response = await leaveService.getPending();
            setRequests(response.data);
        } catch (error) {
            console.error('Failed to fetch pending requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const leaveTypeLabels: Record<string, string> = {
        ANNUAL: 'Phép năm',
        SICK: 'Phép bệnh',
        UNPAID: 'Không lương',
        MATERNITY: 'Thai sản',
        PATERNITY: 'Chăm con',
        BEREAVEMENT: 'Tang lễ',
    };

    return (
        <ProtectedRoute>
            <>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">Đơn chờ duyệt</h1>
                            <p className="text-slate-500 mt-1">Danh sách các đơn nghỉ phép đang chờ phê duyệt</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                            <Clock className="text-yellow-600" size={20} />
                            <span className="font-bold text-yellow-700">{requests.length} đơn chờ duyệt</span>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div className="bg-white rounded-2xl border border-slate-200">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 mt-4">Đang tải...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p className="text-slate-500 text-lg">Không có đơn nào chờ duyệt</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Nhân viên
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Loại phép
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Từ ngày
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Đến ngày
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Số ngày
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Lý do
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Ngày tạo
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Hành động
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {requests.map((request, index) => (
                                            <motion.tr
                                                key={request.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold text-xs">
                                                            {request.employee?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-primary">{request.employee?.fullName || 'N/A'}</p>
                                                            <p className="text-xs text-slate-500">{request.employee?.employeeCode || ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-primary">
                                                        {leaveTypeLabels[request.leaveType] || request.leaveType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.startDate)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.endDate)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-semibold text-brandBlue">{request.totalDays}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 line-clamp-1 max-w-xs">{request.reason}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(request.createdAt)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/leaves/${request.id}`)}
                                                        className="px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                                    >
                                                        Xem & Duyệt
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </>
        </ProtectedRoute>
    );
}
