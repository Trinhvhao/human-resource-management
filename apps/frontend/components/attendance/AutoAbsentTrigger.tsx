'use client';

import { useState } from 'react';
import { UserX, Loader2, CheckCircle, AlertCircle, Users, Calendar, Clock } from 'lucide-react';
import attendanceService from '@/services/attendanceService';

interface AutoAbsentResult {
    date: Date;
    totalActive: number;
    markedAbsent: number;
    onLeave: number;
    checkedIn: number;
    absentEmployees: Array<{
        id: string;
        code: string;
        name: string;
        department: string;
    }>;
}

export default function AutoAbsentTrigger() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AutoAbsentResult | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleTrigger = async () => {
        setLoading(true);
        try {
            const response = await attendanceService.autoMarkAbsent();
            setResult(response.data);
            setShowConfirm(false);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to mark absents');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl" />

            {/* Content */}
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-30" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <UserX className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Đánh vắng tự động</h3>
                        <p className="text-sm text-slate-600">Đánh dấu nhân viên không check-in là vắng mặt</p>
                    </div>
                </div>

                {/* Info Box */}
                <div className="relative overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl" />
                    <div className="relative bg-white/60 backdrop-blur-sm border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <div className="text-sm text-blue-900">
                                <p className="font-bold mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Lưu ý quan trọng:
                                </p>
                                <ul className="space-y-1.5 text-blue-800">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Hệ thống tự động chạy lúc <strong>7 giờ tối</strong> hàng ngày</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Chỉ đánh vắng nhân viên <strong>không check-in</strong> và <strong>không có phép</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Nhân viên có phép được duyệt sẽ <strong>không bị đánh vắng</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-600 font-bold">•</span>
                                        <span>Sử dụng nút này <strong>chỉ khi cần chạy thủ công</strong></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trigger Button */}
                {!showConfirm ? (
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <UserX className="w-5 h-5" />
                        Chạy đánh vắng thủ công
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl" />
                            <div className="relative bg-white/60 backdrop-blur-sm border-2 border-yellow-300 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-900 font-semibold">
                                        Bạn có chắc muốn đánh vắng tất cả nhân viên chưa check-in hôm nay?
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleTrigger}
                                disabled={loading}
                                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Xác nhận
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl disabled:opacity-50 font-semibold transition-all"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Kết quả thực hiện
                        </h4>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-slate-600" />
                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tổng NV</span>
                                </div>
                                <div className="text-xl font-bold text-slate-900">{result.totalActive}</div>
                            </div>

                            <div className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border-2 border-red-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <UserX className="w-4 h-4 text-red-600" />
                                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Vắng</span>
                                </div>
                                <div className="text-xl font-bold text-red-600">{result.markedAbsent}</div>
                            </div>

                            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Có phép</span>
                                </div>
                                <div className="text-xl font-bold text-blue-600">{result.onLeave}</div>
                            </div>

                            <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Đã check-in</span>
                                </div>
                                <div className="text-xl font-bold text-green-600">{result.checkedIn}</div>
                            </div>
                        </div>

                        {/* Absent Employees List */}
                        {result.absentEmployees.length > 0 ? (
                            <div>
                                <h5 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <UserX className="w-4 h-4 text-red-600" />
                                    Nhân viên đã đánh vắng ({result.absentEmployees.length})
                                </h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {result.absentEmployees.map((emp) => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl hover:shadow-md transition-shadow"
                                        >
                                            <div>
                                                <div className="font-bold text-slate-900">{emp.name}</div>
                                                <div className="text-sm text-slate-600 font-medium">
                                                    {emp.code} • {emp.department || 'Chưa có phòng ban'}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow-md">
                                                VẮNG
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl" />
                                <div className="relative bg-white/60 backdrop-blur-sm border-2 border-green-300 rounded-xl p-4 text-center">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <p className="text-green-900 font-bold mb-1">
                                        Không có nhân viên nào cần đánh vắng! 🎉
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Tất cả nhân viên đã check-in hoặc có phép
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
