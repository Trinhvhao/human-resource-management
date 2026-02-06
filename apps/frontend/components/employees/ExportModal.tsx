'use client';

import { useState } from 'react';
import { X, FileSpreadsheet, Loader2, CheckCircle } from 'lucide-react';
import exportService from '@/services/exportService';

interface ExportModalProps {
  onClose: () => void;
  filters: {
    departments: string[];
    positions: string[];
    statuses: string[];
  };
}

export default function ExportModal({ onClose, filters }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      // Build export params from filters
      const params: any = {};
      
      // Only single department supported by backend
      if (filters.departments.length === 1) {
        params.departmentId = filters.departments[0];
      }
      
      // Only single status supported by backend
      if (filters.statuses.length === 1) {
        params.status = filters.statuses[0];
      }
      
      // Only single position supported by backend
      if (filters.positions.length === 1) {
        params.position = filters.positions[0];
      }

      await exportService.exportAndDownloadEmployees(params);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err?.message || 'Xuất file thất bại. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brandBlue to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Xuất danh sách nhân viên</h3>
              <p className="text-blue-100 text-sm">Định dạng: Excel (.xlsx)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={exporting}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Export Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900">Thông tin xuất file:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Định dạng: Microsoft Excel (.xlsx)</li>
              <li>• Bao gồm: Mã NV, Họ tên, Email, SĐT, Phòng ban, Chức vụ, Lương, Ngày vào làm, Trạng thái</li>
              {filters.departments.length > 0 && (
                <li>• Lọc theo phòng ban: {filters.departments.length === 1 ? 'Có' : `${filters.departments.length} phòng ban (chỉ xuất 1)`}</li>
              )}
              {filters.statuses.length > 0 && (
                <li>• Lọc theo trạng thái: {filters.statuses.length === 1 ? filters.statuses[0] : `${filters.statuses.length} trạng thái (chỉ xuất 1)`}</li>
              )}
              {filters.positions.length > 0 && (
                <li>• Lọc theo chức vụ: {filters.positions.length === 1 ? filters.positions[0] : `${filters.positions.length} chức vụ (chỉ xuất 1)`}</li>
              )}
            </ul>
          </div>

          {/* Multi-filter warning */}
          {(filters.departments.length > 1 || filters.statuses.length > 1 || filters.positions.length > 1) && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-900">⚠️ Lưu ý:</p>
              <p className="text-sm text-yellow-700 mt-1">
                Bạn đang chọn nhiều bộ lọc. Hệ thống sẽ chỉ xuất dữ liệu với bộ lọc đầu tiên.
                Để xuất đầy đủ, vui lòng chọn từng bộ lọc riêng lẻ.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-900">❌ Lỗi:</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-sm font-semibold text-green-900">✅ Xuất file thành công!</p>
                <p className="text-sm text-green-700">File đang được tải xuống...</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={exporting}
            className="flex-1 px-4 py-2.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || success}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brandBlue to-blue-600 text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Đang xuất...
              </>
            ) : success ? (
              <>
                <CheckCircle size={18} />
                Hoàn tất
              </>
            ) : (
              <>
                <FileSpreadsheet size={18} />
                Xuất Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
