'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, User, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import leaveService from '@/services/leaveService';
import { LeaveRequest } from '@/types/leave';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/hooks/useConfirm';

const leaveTypeLabels: Record<string, string> = {
  ANNUAL: 'Phép năm',
  SICK: 'Phép bệnh',
  UNPAID: 'Không lương',
  MATERNITY: 'Thai sản',
  PATERNITY: 'Chăm con',
  BEREAVEMENT: 'Tang lễ',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-green-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function LeaveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuthStore();
  const { confirm, ConfirmDialog, closeModal, setLoading: setConfirmLoading } = useConfirm();
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchLeaveDetail();
  }, [id]);

  const fetchLeaveDetail = async () => {
    try {
      setLoading(true);
      const response = await leaveService.getById(id);
      setLeave(response.data);
    } catch (error) {
      console.error('Failed to fetch leave detail:', error);
      toast.error('Không thể tải thông tin đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận duyệt đơn',
      message: 'Bạn có chắc muốn duyệt đơn nghỉ phép này?',
      confirmText: 'Duyệt đơn',
      type: 'success'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await leaveService.approve(id);
      closeModal();
      toast.success('Duyệt đơn thành công');
      fetchLeaveDetail();
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
      await leaveService.reject(id, rejectReason);
      toast.success('Từ chối đơn thành công');
      setShowRejectModal(false);
      fetchLeaveDetail();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      toast.error(error.response?.data?.message || 'Từ chối đơn thất bại');
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: 'Xác nhận hủy đơn',
      message: 'Bạn có chắc muốn hủy đơn nghỉ phép này?',
      confirmText: 'Hủy đơn',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      setConfirmLoading(true);
      await leaveService.cancel(id);
      closeModal();
      toast.success('Hủy đơn thành công');
      router.push('/dashboard/leaves');
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      closeModal();
      toast.error(error.response?.data?.message || 'Hủy đơn thất bại');
    }
  };

  const canApprove = user?.role && ['ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role) && leave?.status === 'PENDING';
  const canCancel = leave?.status === 'PENDING' && leave?.employeeId === user?.employeeId;

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-brandBlue" />
        </div>
      </>
    );
  }

  if (!leave) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-slate-500">Không tìm thấy đơn nghỉ phép</p>
        </div>
      </>
    );
  }

  const status = statusLabels[leave.status];

  return (
    <ProtectedRoute>
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
                <h1 className="text-3xl font-bold text-primary">Chi tiết đơn nghỉ phép</h1>
                <p className="text-slate-500 mt-1">Mã đơn: {leave.id.slice(0, 8)}</p>
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
                    <p className="font-semibold">{leave.employee?.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Mã nhân viên</p>
                    <p className="font-semibold">{leave.employee?.employeeCode || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Phòng ban</p>
                    <p className="font-semibold">{leave.employee?.department?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-primary mb-4">Thông tin nghỉ phép</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-brandBlue" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Loại phép</p>
                      <p className="font-semibold">{leaveTypeLabels[leave.leaveType]}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Thời gian</p>
                      <p className="font-semibold">
                        {new Date(leave.startDate).toLocaleDateString('vi-VN')} - {new Date(leave.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Số ngày</p>
                      <p className="font-semibold">{leave.totalDays} ngày</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-500 mb-2">Lý do</p>
                    <p className="text-slate-700 whitespace-pre-wrap">{leave.reason}</p>
                  </div>
                </div>
              </div>

              {/* Approval Info */}
              {(leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <h2 className="text-xl font-bold text-primary mb-4">
                    {leave.status === 'APPROVED' ? 'Thông tin duyệt' : 'Thông tin từ chối'}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${leave.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        <User className={leave.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'} size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Người duyệt</p>
                        <p className="font-semibold">{leave.approver?.email || 'N/A'}</p>
                      </div>
                    </div>

                    {leave.approvedAt && (
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${leave.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                          <Clock className={leave.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'} size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Thời gian</p>
                          <p className="font-semibold">{new Date(leave.approvedAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                    )}

                    {leave.rejectedReason && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500 mb-2">Lý do từ chối</p>
                        <p className="text-red-600 whitespace-pre-wrap">{leave.rejectedReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
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

              {/* Timeline */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-primary mb-4">Lịch sử</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-semibold">Tạo đơn</p>
                      <p className="text-xs text-slate-500">{new Date(leave.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {leave.approvedAt && (
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${leave.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      <div>
                        <p className="text-sm font-semibold">{leave.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</p>
                        <p className="text-xs text-slate-500">{new Date(leave.approvedAt).toLocaleString('vi-VN')}</p>
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
              <h3 className="text-xl font-bold text-primary mb-4">Từ chối đơn nghỉ phép</h3>
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
    </ProtectedRoute>
  );
}
