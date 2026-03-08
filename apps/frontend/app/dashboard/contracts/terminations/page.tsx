'use client';

import { useState, useEffect } from 'react';
import TerminationApprovalPanel from '@/components/contracts/TerminationApprovalPanel';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, Clock, Flame, CheckCircle, FileX, History } from 'lucide-react';
import { terminationRequestService } from '@/services/terminationRequestService';

export default function TerminationManagementPage() {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [stats, setStats] = useState({
        pending: 0,
        urgent: 0,
        approvedThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showUrgentOnly, setShowUrgentOnly] = useState(false);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const pendingData = await terminationRequestService.getPendingTerminations();
            const pending = pendingData?.length || 0;

            // Calculate urgent (≤7 days)
            const urgent = pendingData?.filter((req: any) => {
                const daysRemaining = Math.ceil(
                    (new Date(req.terminationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysRemaining <= 7;
            }).length || 0;

            const approvedThisMonth = 0;

            setStats({ pending, urgent, approvedThisMonth });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check permissions
    if (!user || (user.role !== 'HR_MANAGER' && user.role !== 'ADMIN')) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Không có quyền truy cập
                        </h2>
                        <p className="text-slate-600">
                            Bạn không có quyền truy cập trang này. Chỉ HR Manager và Admin mới có thể phê duyệt yêu cầu chấm dứt hợp đồng.
                        </p>
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
                                <FileX className="text-white" size={24} />
                            </div>
                            Quản lý chấm dứt hợp đồng
                        </h1>
                        <p className="text-slate-600">Xem và phê duyệt các yêu cầu chấm dứt hợp đồng từ nhân viên</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-yellow-800 mb-1">Chờ phê duyệt</p>
                                <p className="text-3xl font-bold text-yellow-900">
                                    {loading ? '-' : stats.pending}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                                <Clock className="text-yellow-700" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-red-800 mb-1">Khẩn cấp (≤7 ngày)</p>
                                <p className="text-3xl font-bold text-red-900">
                                    {loading ? '-' : stats.urgent}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                                <Flame className="text-red-700" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-800 mb-1">Đã phê duyệt tháng này</p>
                                <p className="text-3xl font-bold text-green-900">
                                    {loading ? '-' : stats.approvedThisMonth}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                <CheckCircle className="text-green-700" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs - Simple & Practical */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">Hiển thị:</span>

                    <button
                        onClick={() => setShowUrgentOnly(false)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!showUrgentOnly
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300'
                            }`}
                    >
                        <Clock className="inline-block mr-2" size={16} />
                        Tất cả ({stats.pending})
                    </button>

                    <button
                        onClick={() => setShowUrgentOnly(true)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${showUrgentOnly
                            ? 'bg-red-600 text-white shadow-lg'
                            : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-red-300'
                            }`}
                    >
                        <Flame className="inline-block mr-2" size={16} />
                        Khẩn cấp ({stats.urgent})
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200">
                    <div className="border-b-2 border-slate-200">
                        <nav className="flex gap-6 px-6">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'pending'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Clock size={18} />
                                Chờ phê duyệt
                                {stats.pending > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        {stats.pending}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 ${activeTab === 'history'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <History size={18} />
                                Lịch sử
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'pending' && (
                            <TerminationApprovalPanel
                                userId={user.id}
                                onUpdate={fetchStats}
                                urgentOnly={showUrgentOnly}
                            />
                        )}

                        {activeTab === 'history' && (
                            <div className="text-center py-12">
                                <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium mb-2">Tính năng lịch sử đang được phát triển</p>
                                <p className="text-slate-400 text-sm">Sẽ sớm có trong phiên bản tiếp theo</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
