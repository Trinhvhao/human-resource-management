'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, User, Calendar, FileText, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import departmentChangeRequestService from '@/services/departmentChangeRequestService';
import { DepartmentChangeRequest } from '@/types/department-change-request';

export default function ChangeRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<DepartmentChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRequest();
    }
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await departmentChangeRequestService.getChangeRequest(params.id as string);
      setRequest(response.data);
    } catch (error) {
      console.error('Failed to fetch request:', error);
      alert('Không tìm thấy yêu cầu');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!request) return;

    try {
      setSubmitting(true);
      await departmentChangeRequestService.reviewChangeRequest(request.id, {
        action: reviewAction,
        reviewNote: reviewNote || undefined,
      });

      alert(`Yêu cầu đã được ${reviewAction === 'APPROVE' ? 'phê duyệt' : 'từ chối'} thành công`);
      router.push('/dashboard/departments/change-requests');
    } catch (error: any) {
      console.error('Failed to review:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
      setShowApprovalModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle2,
      REJECTED: XCircle,
      CANCELLED: AlertCircle,
    };

    const labels = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${styles[status as keyof typeof styles]}`}>
        <Icon size={16} />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="bg-white rounded-xl p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!request) return null;

  const canReview = request.status === 'PENDING';

  return (
    <DashboardLayout>
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
              <h1 className="text-3xl font-bold text-slate-900">Chi tiết yêu cầu thay đổi</h1>
              <p className="text-slate-600 mt-1">{request.department?.name}</p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin yêu cầu</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Loại yêu cầu</p>
                  <p className="font-semibold text-slate-900">
                    {request.requestType === 'CHANGE_MANAGER' ? 'Thay đổi trưởng phòng' : 
                     request.requestType === 'CHANGE_PARENT' ? 'Thay đổi phòng ban cấp trên' : 
                     'Tái cấu trúc'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ngày hiệu lực</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(request.effectiveDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Người yêu cầu</p>
                  <p className="font-semibold text-slate-900">
                    {request.requester?.employee?.fullName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Ngày tạo</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Lý do thay đổi:</p>
                <p className="text-slate-900">{request.reason}</p>
              </div>
            </div>

            {/* Manager Change Details */}
            {request.requestType === 'CHANGE_MANAGER' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Thay đổi trưởng phòng</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-red-700 mb-3">Trưởng phòng cũ</p>
                    {request.oldManager ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center text-red-700 font-bold">
                          {request.oldManager.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{request.oldManager.fullName}</p>
                          <p className="text-sm text-slate-600">{request.oldManager.position}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Chưa có</p>
                    )}
                  </div>

                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-700 mb-3">Trưởng phòng mới</p>
                    {request.newManager ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                          {request.newManager.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{request.newManager.fullName}</p>
                          <p className="text-sm text-slate-600">{request.newManager.position}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">Không chọn</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Review Section */}
            {request.status !== 'PENDING' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Kết quả phê duyệt</h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500">Người duyệt</p>
                    <p className="font-semibold text-slate-900">
                      {request.reviewer?.employee?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Thời gian duyệt</p>
                    <p className="font-semibold text-slate-900">
                      {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                  {request.reviewNote && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Ghi chú:</p>
                      <p className="text-slate-900">{request.reviewNote}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Impact Analysis */}
            {request.impact && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-blue-600" size={20} />
                  <h3 className="font-bold text-blue-900">Phân tích ảnh hưởng</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600">Nhân viên bị ảnh hưởng</p>
                    <p className="text-2xl font-bold text-slate-900">{request.impact.affectedEmployees}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600">Teams bị ảnh hưởng</p>
                    <p className="text-2xl font-bold text-slate-900">{request.impact.affectedTeams}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600">Yêu cầu chờ duyệt</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-sm">Nghỉ phép: <strong>{request.impact.pendingApprovals.leaves}</strong></span>
                      <span className="text-sm">OT: <strong>{request.impact.pendingApprovals.overtime}</strong></span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-slate-600">Thời gian bàn giao dự kiến</p>
                    <p className="text-2xl font-bold text-slate-900">{request.impact.estimatedTransitionDays} ngày</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {canReview && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Hành động</h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setReviewAction('APPROVE');
                      setShowApprovalModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <CheckCircle2 size={18} />
                    Phê duyệt
                  </button>
                  
                  <button
                    onClick={() => {
                      setReviewAction('REJECT');
                      setShowApprovalModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                  >
                    <XCircle size={18} />
                    Từ chối
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {reviewAction === 'APPROVE' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={4}
                placeholder="Nhập ghi chú của bạn..."
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className={`flex-1 px-4 py-3 text-white rounded-lg font-semibold transition-colors ${
                  reviewAction === 'APPROVE'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
