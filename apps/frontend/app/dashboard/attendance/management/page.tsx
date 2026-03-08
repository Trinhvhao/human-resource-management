'use client';

import { Settings, Shield, Sparkles, TrendingUp, BookOpen, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import AttendanceValidation from '@/components/attendance/AttendanceValidation';
import AutoAbsentTrigger from '@/components/attendance/AutoAbsentTrigger';
export default function AttendanceManagementPage() {
    return (
        <>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Enhanced Header with Gradient Background */}
                <div className="relative overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6bS00IDB2Mmgydi0yaC0yem0tNCAwdjJoMnYtMmgtMnptLTQgMHYyaDJ2LTJoLTJ6TTQgNHYyaDJ2LTJINHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />

                    {/* Content */}
                    <div className="relative p-8">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                                        <Settings className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                            Quản lý chấm công
                                        </h1>
                                        <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                                    </div>
                                    <p className="text-slate-600 text-lg">Công cụ quản lý và kiểm tra dữ liệu chấm công chuyên nghiệp</p>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-sm">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-slate-700">Tối ưu hiệu suất</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Admin Notice */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 rounded-2xl" />
                    <div className="relative bg-white/60 backdrop-blur-sm border-2 border-amber-300 rounded-2xl p-5 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-amber-900 mb-1 flex items-center gap-2">
                                    Chỉ dành cho HR Manager
                                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-semibold rounded-full">ADMIN</span>
                                </h3>
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    Các công cụ này yêu cầu quyền quản trị. Sử dụng cẩn thận và kiểm tra kỹ trước khi thực hiện.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Tools Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AttendanceValidation />
                    <AutoAbsentTrigger />
                </div>

                {/* Enhanced Info Section */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl" />
                    <div className="relative bg-white/60 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Hướng dẫn sử dụng</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Validation Guide */}
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-900">Kiểm tra dữ liệu chấm công</h4>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span>Chọn tháng và năm cần kiểm tra</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span>Nhấn "Kiểm tra" để phát hiện vấn đề</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span>Xem danh sách nhân viên có vấn đề</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span>Sửa các bản ghi không đầy đủ</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                        <span>Liên hệ nhân viên thiếu ngày công</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Auto-Absent Guide */}
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <h4 className="font-semibold text-slate-900">Đánh vắng tự động</h4>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span>Hệ thống tự động chạy lúc 7 giờ tối</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span>Chỉ dùng nút thủ công khi cần thiết</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span>Kiểm tra kết quả sau khi chạy</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span>Nhân viên có phép không bị đánh vắng</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <span>Có thể điều chỉnh sau nếu cần</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Best Practices */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl" />
                    <div className="relative bg-white/60 backdrop-blur-sm border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900">Quy trình đề xuất</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Step 1 */}
                            <div className="group relative">
                                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent" />
                                <div className="flex items-start gap-4 relative">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                                        1
                                    </div>
                                    <div className="flex-1 bg-white rounded-xl p-4 border border-blue-100 shadow-sm group-hover:shadow-md transition-shadow">
                                        <p className="font-semibold text-slate-900 mb-1">Cuối mỗi ngày (sau 7 PM)</p>
                                        <p className="text-sm text-slate-600">Kiểm tra danh sách nhân viên vắng mặt từ hệ thống tự động</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="group relative">
                                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent" />
                                <div className="flex items-start gap-4 relative">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                                        2
                                    </div>
                                    <div className="flex-1 bg-white rounded-xl p-4 border border-blue-100 shadow-sm group-hover:shadow-md transition-shadow">
                                        <p className="font-semibold text-slate-900 mb-1">Trước khi chạy lương (cuối tháng)</p>
                                        <p className="text-sm text-slate-600">Chạy kiểm tra dữ liệu để phát hiện và sửa các vấn đề</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="group relative">
                                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent" />
                                <div className="flex items-start gap-4 relative">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                                        3
                                    </div>
                                    <div className="flex-1 bg-white rounded-xl p-4 border border-blue-100 shadow-sm group-hover:shadow-md transition-shadow">
                                        <p className="font-semibold text-slate-900 mb-1">Sau khi sửa xong</p>
                                        <p className="text-sm text-slate-600">Chạy kiểm tra lại để đảm bảo không còn vấn đề</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="group relative">
                                <div className="flex items-start gap-4 relative">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                                        4
                                    </div>
                                    <div className="flex-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 shadow-sm group-hover:shadow-md transition-shadow">
                                        <p className="font-semibold text-green-900 mb-1">Tạo bảng lương</p>
                                        <p className="text-sm text-green-700">Dữ liệu chấm công đã sạch, có thể tạo lương an toàn</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
