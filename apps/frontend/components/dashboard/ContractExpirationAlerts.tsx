'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dashboardService, {
    ContractAlert,
    AlertSeverity,
} from '@/services/dashboardService';
import { toast } from '@/lib/toast';

interface ContractExpirationAlertsProps {
    days?: number;
    maxDisplay?: number;
}

export default function ContractExpirationAlerts({
    days = 60,
    maxDisplay = 10,
}: ContractExpirationAlertsProps) {
    const router = useRouter();
    const [alerts, setAlerts] = useState<ContractAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [bySeverity, setBySeverity] = useState<Record<AlertSeverity, number>>({
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        INFO: 0,
    });

    useEffect(() => {
        fetchAlerts();
    }, [days]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const response = await dashboardService.getContractAlerts(days);
            if (response.data) {
                setAlerts(response.data.alerts.slice(0, maxDisplay));
                setBySeverity(response.data.bySeverity);
            }
        } catch (error: any) {
            console.error('Error fetching contract alerts:', error);
            toast.error('Không thể tải cảnh báo hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: AlertSeverity): string => {
        switch (severity) {
            case 'HIGH':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'MEDIUM':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'LOW':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'INFO':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSeverityIcon = (severity: AlertSeverity): string => {
        switch (severity) {
            case 'HIGH':
                return '🔴';
            case 'MEDIUM':
                return '🟠';
            case 'LOW':
                return '🟡';
            case 'INFO':
                return '🔵';
            default:
                return '⚪';
        }
    };

    const getSeverityLabel = (severity: AlertSeverity): string => {
        switch (severity) {
            case 'HIGH':
                return 'Khẩn cấp';
            case 'MEDIUM':
                return 'Quan trọng';
            case 'LOW':
                return 'Bình thường';
            case 'INFO':
                return 'Thông tin';
            default:
                return 'Không xác định';
        }
    };

    const getContractTypeLabel = (type: string): string => {
        switch (type) {
            case 'PROBATION':
                return 'Thử việc';
            case 'FIXED_TERM':
                return 'Có thời hạn';
            case 'INDEFINITE':
                return 'Không thời hạn';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleAlertClick = (contractId: string) => {
        router.push(`/dashboard/contracts/${contractId}`);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const totalAlerts = alerts.length;

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Cảnh báo hợp đồng sắp hết hạn
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalAlerts} hợp đồng sẽ hết hạn trong {days} ngày tới
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard/contracts')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Xem tất cả →
                    </button>
                </div>

                {/* Severity Summary */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                    {(['HIGH', 'MEDIUM', 'LOW', 'INFO'] as AlertSeverity[]).map(
                        (severity) => (
                            <div
                                key={severity}
                                className={`p-3 rounded-lg border ${getSeverityColor(severity)}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">{getSeverityIcon(severity)}</span>
                                    <span className="text-2xl font-bold">
                                        {bySeverity[severity]}
                                    </span>
                                </div>
                                <p className="text-xs mt-1 font-medium">
                                    {getSeverityLabel(severity)}
                                </p>
                            </div>
                        ),
                    )}
                </div>
            </div>

            {/* Alerts List */}
            <div className="divide-y divide-gray-200">
                {alerts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="mt-2">Không có hợp đồng nào sắp hết hạn</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.contractId}
                            onClick={() => handleAlertClick(alert.contractId)}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            {getSeverityIcon(alert.severity)}
                                        </span>
                                        <h3 className="font-medium text-gray-900">
                                            {alert.employeeName}
                                        </h3>
                                        <span
                                            className={`px-2 py-0.5 text-xs rounded-full ${getSeverityColor(alert.severity)}`}
                                        >
                                            {getSeverityLabel(alert.severity)}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
                                        <span>Mã NV: {alert.employeeCode}</span>
                                        <span>•</span>
                                        <span>
                                            Loại HĐ: {getContractTypeLabel(alert.contractType)}
                                        </span>
                                        {alert.contractNumber && (
                                            <>
                                                <span>•</span>
                                                <span>Số HĐ: {alert.contractNumber}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <svg
                                            className="h-4 w-4 text-gray-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span className="text-gray-600">
                                            Hết hạn: {formatDate(alert.expirationDate)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div
                                        className={`text-2xl font-bold ${alert.daysRemaining <= 7
                                            ? 'text-red-600'
                                            : alert.daysRemaining <= 15
                                                ? 'text-orange-600'
                                                : alert.daysRemaining <= 30
                                                    ? 'text-yellow-600'
                                                    : 'text-blue-600'
                                            }`}
                                    >
                                        {alert.daysRemaining}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">ngày còn lại</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={() => router.push('/dashboard/contracts?filter=expiring')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Xem tất cả {totalAlerts} cảnh báo
                    </button>
                </div>
            )}
        </div>
    );
}
