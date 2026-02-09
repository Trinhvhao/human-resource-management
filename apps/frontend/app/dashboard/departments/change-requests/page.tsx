'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Clock, CheckCircle2, XCircle, AlertCircle, FileText, User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import departmentChangeRequestService from '@/services/departmentChangeRequestService';
import { DepartmentChangeRequest, ChangeRequestStatus } from '@/types/department-change-request';
import { useRouter } from 'next/navigation';

export default function ChangeRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DepartmentChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChangeRequestStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await departmentChangeRequestService.getChangeRequests(
        filter !== 'ALL' ? { status: filter } : undefined
      );
      setRequests(response.data || []);
    } catch (error: any) {
      console.error('Error fetching change requests:', error);
      setRequests([]);
      setError(error.response?.data?.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ChangeRequestStatus) => {
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

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 ${styles[status]}`}>
        <Icon size={14} />
        {labels[status]}
      </span>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      CHANGE_MANAGER: 'Thay đổi trưởng phòng',
      CHANGE_PARENT: 'Thay đổi phòng ban cấp trên',
      RESTRUCTURE: 'Tái cấu trúc',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredRequests = requests;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-brandBlue via-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Yêu cầu thay đổi phòng ban</h1>
              <p className="text-blue-100 text-lg">Quản lý các yêu cầu thay đổi cần phê duyệt</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
              <FileText size={48} className="text-white" />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tất cả</p>
                <p className="text-2xl font-bold text-slate-900">{requests?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests?.filter(r => r.status === 'PENDING').length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests?.filter(r => r.status === 'APPROVED').length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests?.filter(r => r.status === 'REJECTED').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900">Lọc theo trạng thái:</span>
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === status
                    ? 'bg-gradient-to-r from-brandBlue to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-105'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl border border-red-200 p-12 text-center">
            <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white shadow-lg flex items-center justify-center">
              <FileText className="text-slate-400" size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Không có yêu cầu nào</h3>
            <p className="text-slate-600">Chưa có yêu cầu thay đổi phòng ban nào được tạo</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-brandBlue hover:shadow-2xl transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/departments/change-requests/${request.id}`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center">
                        <FileText className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-brandBlue transition-colors">
                          {request.department?.name || 'N/A'}
                        </h3>
                        <p className="text-sm text-slate-600 font-medium">
                          {getRequestTypeLabel(request.requestType)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Người yêu cầu</p>
                      <p className="text-sm font-bold text-slate-900">
                        {request.requester?.employee?.fullName || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Ngày hiệu lực</p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(request.effectiveDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {request.requestType === 'CHANGE_MANAGER' && (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Trưởng phòng cũ</p>
                        <p className="text-sm font-bold text-slate-900">
                          {request.oldManager?.fullName || 'Chưa có'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1">Trưởng phòng mới</p>
                        <p className="text-sm font-bold text-brandBlue">
                          {request.newManager?.fullName || 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-600 font-bold mb-2">Lý do:</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{request.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
