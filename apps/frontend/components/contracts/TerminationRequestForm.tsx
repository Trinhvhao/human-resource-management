'use client';

import { useState } from 'react';
import { terminationRequestService } from '@/services/terminationRequestService';
import {
    TerminationCategory,
    TERMINATION_CATEGORY_LABELS,
    CreateTerminationRequestDto,
} from '@/types/termination-request';
import { toast } from '@/lib/toast';

interface TerminationRequestFormProps {
    contractId: string;
    userId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function TerminationRequestForm({
    contractId,
    userId,
    onSuccess,
    onCancel,
}: TerminationRequestFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        terminationCategory: '' as TerminationCategory,
        noticeDate: '',
        terminationDate: '',
        reason: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data: CreateTerminationRequestDto = {
                contractId,
                requestedBy: userId,
                terminationCategory: formData.terminationCategory,
                noticeDate: formData.noticeDate,
                terminationDate: formData.terminationDate,
                reason: formData.reason,
            };

            await terminationRequestService.createTerminationRequest(data);
            toast.success('Yêu cầu chấm dứt hợp đồng đã được tạo thành công');
            onSuccess?.();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Không thể tạo yêu cầu chấm dứt hợp đồng';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại chấm dứt hợp đồng <span className="text-red-500">*</span>
                </label>
                <select
                    value={formData.terminationCategory}
                    onChange={(e) =>
                        setFormData({ ...formData, terminationCategory: e.target.value as TerminationCategory })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">-- Chọn loại chấm dứt --</option>
                    {Object.entries(TERMINATION_CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày thông báo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.noticeDate}
                        onChange={(e) => setFormData({ ...formData, noticeDate: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ngày bắt đầu tính thời gian báo trước
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày chấm dứt <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.terminationDate}
                        onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Ngày chính thức chấm dứt hợp đồng
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do chấm dứt <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    rows={4}
                    placeholder="Nhập lý do chi tiết..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Lưu ý về thời gian báo trước:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Hợp đồng không xác định thời hạn: <strong>45 ngày</strong></li>
                    <li>• Hợp đồng xác định thời hạn 12-36 tháng: <strong>30 ngày</strong></li>
                    <li>• Hợp đồng xác định thời hạn dưới 12 tháng: <strong>3 ngày</strong></li>
                </ul>
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Hủy
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Đang xử lý...' : 'Tạo yêu cầu chấm dứt'}
                </button>
            </div>
        </form>
    );
}
