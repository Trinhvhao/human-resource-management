'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import contractService from '@/services/contractService';
import { ExpiringContract } from '@/types/contract';

export default function ExpiringContractsWidget() {
    const router = useRouter();
    const [contracts, setContracts] = useState<ExpiringContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);

    useEffect(() => {
        fetchExpiringContracts();
    }, [days]);

    const fetchExpiringContracts = async () => {
        try {
            setLoading(true);
            const response = await contractService.getExpiring(days);
            if (response.success && response.data) {
                setContracts(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch expiring contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const getUrgencyColor = (daysLeft: number) => {
        if (daysLeft <= 7) return 'text-red-600 bg-red-50';
        if (daysLeft <= 15) return 'text-orange-600 bg-orange-50';
        return 'text-yellow-600 bg-yellow-50';
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Hợp đồng sắp hết hạn</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {contracts.length} hợp đồng sẽ hết hạn trong {days} ngày tới
                    </p>
                </div>
                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value={7}>7 ngày</option>
                    <option value={15}>15 ngày</option>
                    <option value={30}>30 ngày</option>
                    <option value={60}>60 ngày</option>
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500">Không có hợp đồng nào sắp hết hạn</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contracts.slice(0, 5).map(({ contract, daysUntilExpiry }) => (
                        <div
                            key={contract.id}
                            onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {contract.employee.fullName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {contract.employee.position} • {contract.contractNumber}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Hết hạn: {contract.endDate ? formatDate(contract.endDate) : 'N/A'}
                                </p>
                            </div>
                            <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(daysUntilExpiry)}`}>
                                {daysUntilExpiry === 0 ? 'Hôm nay' : `${daysUntilExpiry} ngày`}
                            </div>
                        </div>
                    ))}

                    {contracts.length > 5 && (
                        <button
                            onClick={() => router.push('/dashboard/contracts?status=ACTIVE')}
                            className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Xem tất cả {contracts.length} hợp đồng →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
