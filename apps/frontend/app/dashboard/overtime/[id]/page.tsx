'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, User, FileText, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import overtimeService from '@/services/overtimeService';
import { Overtime } from '@/types/overtime';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function OvertimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();
  const [overtime, setOvertime] = useState<Overtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchOvertimeDetail();
  }, [id]);

  const fetchOvertimeDetail = async () => {
    try {
      setLoading(true);
      const response = await overtimeService.getById(id);
      // Handle both wrapped and unwrapped responses
      const data = response.data || response;
      setOvertime(data);
    } catch (error) {
      console.error('Failed to fetch overtime detail:', error);
      toast.error('Không thể tải thông tin đơn tăng ca');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận duyệt đơn',
      message: 'Bạn có chắc muốn duyệt đơn tăng ca này?',
      confirmText: 'Duyệt đơn',
      type: 'success'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await overtimeService.approve(id);
      closeModal();
      toast.success('Duyệt đơn thành công');
      fetchOvertimeDetail();
    } catch (error: any) {
      console.error('Failed to approve:', error);
      closeModal();
      toast.error(error.response?.data?.message || 'Duyệt đơn thất bại');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await overtimeService.reject(id, { rejectedReason: rejectReason });
      toast.success('Từ chối đơn thành công');
      setShowRejectModal(false);
      fetchOvertimeDetail();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      toast.error(error.response?.data?.message || 'Từ chối đơn thất bại');
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận hủy đơn',
      message: 'Bạn có chắc muốn hủy đơn tăng ca này?',
      confirmText: 'Hủy đơn',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await overtimeService.cancel(id);
      closeModal();
      toast.success('Hủy đơn thành công');
      router.push(user?.role === 'EMPLOYEE' ? '/dashboard/my-overtime' : '/dashboard/overtime');
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      closeModal();
      toast.error(error.response?.data?.message || 'Hủy đơn thất bại');
    }
  };

  const canApprove = user?.role && ['ADMIN', 'HR_MANAGER'].includes(user.role) && overtime?.status === 'PENDING';
  const canCancel = overtime?.status === 'PENDING' && overtime?.employeeId === user?.employeeId;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-brandBlue" />
        </div>
      </>
    );
  }

  if (!overtime) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-slate-500">Không tìm thấy đơn tăng ca</p>
        </div>
      </>
    );
  }

  const status = statusLabels[overtime.status];
  const overtimePay = overtime.employee?.baseSalary
    ? (Number(overtime.employee.baseSalary) / (22 * 8)) * overtime.hours * 1.5
    : 0;

  return (
    <>
      <ConfirmDialog />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Chi tiết đơn tăng ca</h1>
              <p className="text-slate-500 mt-1">Mã đơn: {overtime.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-lg border-2 font-semibold ${status.color}`}>
            {status.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employee Info */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-primary mb-4">Thông tin nhân viên</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Họ tên</p>
                  <p className="font-semibold">{overtime.employee?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Mã nhân viên</p>
                  <p className="font-semibold">{overtime.employee?.employeeCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phòng ban</p>
                  <p className="font-semibold">{overtime.employee?.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-semibold">{overtime.employee?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Overtime Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h2 className="text-xl font-bold text-primary mb-4">Thông tin tăng ca</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="text-brandBlue" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Ngày tăng ca</p>
                    <p className="font-semibold">{new Date(overtime.date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Thời gian</p>
                    <p className="font-semibold">
                      {new Date(overtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(overtime.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Số giờ</p>
                    <p className="font-semibold">{overtime.hours} giờ</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500 mb-2">Lý do</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{overtime.reason}</p>
                </div>
              </div>
            </div>

            {/* Rejection Reason */}
            {overtime.status === 'REJECTED' && overtime.rejectedReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-red-700 mb-4">Lý do từ chối</h2>
                <p className="text-red-600 whitespace-pre-wrap">{overtime.rejectedReason}</p>
              </div>
            )}
          </div>

          {/* Actions & Info */}
          <div className="space-y-4">
            {canApprove && (
              <>
                <button
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <CheckCircle size={20} />
                  Duyệt đơn
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <XCircle size={20} />
                  Từ chối
                </button>
              </>
            )}

            {canCancel && (
              <button
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <XCircle size={20} />
                Hủy đơn
              </button>
            )}

            {/* Overtime Pay */}
            {overtime.status === 'APPROVED' && overtimePay > 0 && (
              <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-2xl p-6 text-white">
                <h3 className="font-bold mb-2">Lương tăng ca dự kiến</h3>
                <p className="text-3xl font-bold">{overtimePay.toLocaleString('vi-VN')} đ</p>
                <p className="text-white/70 text-sm mt-2">150% lương giờ</p>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="font-bold text-primary mb-4">Lịch sử</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-semibold">Tạo đơn</p>
                    <p className="text-xs text-slate-500">{new Date(overtime.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>

                {overtime.approvedAt && (
                  <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${overtime.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    <div>
                      <p className="text-sm font-semibold">{overtime.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</p>
                      <p className="text-xs text-slate-500">{new Date(overtime.approvedAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">Từ chối đơn tăng ca</h3>
            <p className="text-slate-600 mb-4">Vui lòng nhập lý do từ chối:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
