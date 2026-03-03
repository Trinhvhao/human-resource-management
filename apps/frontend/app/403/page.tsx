'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AccessDeniedPage() {
    const router = useRouter();
    const { user } = useAuthStore();

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            ADMIN: 'Quản trị viên',
            HR_MANAGER: 'Quản lý nhân sự',
            MANAGER: 'Quản lý',
            EMPLOYEE: 'Nhân viên',
        };
        return labels[role] || role;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Error Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
                    {/* Icon */}
                    <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <ShieldAlert className="w-12 h-12 text-red-600" />
                    </div>

                    {/* Error Code */}
                    <div className="mb-4">
                        <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">
                            403
                        </h1>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">
                        Truy cập bị từ chối
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-slate-600 mb-6">
                        Bạn không có quyền truy cập vào trang này.
                    </p>

                    {/* User Info */}
                    {user && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-8 border border-slate-200">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brandBlue to-blue-700 flex items-center justify-center text-white font-bold shadow-md">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                                    <p className="text-xs text-slate-600">
                                        Vai trò: <span className="font-semibold text-brandBlue">{getRoleLabel(user.role)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
                        <p className="text-sm text-blue-900">
                            <span className="font-semibold">Lưu ý:</span> Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ với quản trị viên hệ thống để được cấp quyền truy cập.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-semibold shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft size={20} />
                            Quay lại
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brandBlue to-blue-700 text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all font-semibold shadow-lg shadow-blue-500/30"
                        >
                            <Home size={20} />
                            Về trang chủ
                        </button>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        Mã lỗi: <span className="font-mono font-semibold">403 Forbidden</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
