'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';
import { Calendar, Plus, Clock, CheckCircle, XCircle, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import leaveService from '@/services/leaveService';
import { useAuthStore } from '@/store/authStore';
import { LeaveRequest, LeaveBalance } from '@/types/leave';
import { formatDate } from '@/utils/formatters';

export default function LeavesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { can } = usePermission();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter and pagination states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();

    // Check for success message from sessionStorage
    if (typeof window !== 'undefined') {
      const message = sessionStorage.getItem('leaveRequestSuccess');
      if (message) {
        setSuccessMessage(message);
        sessionStorage.removeItem('leaveRequestSuccess');

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    }
  }, [currentPage, statusFilter, leaveTypeFilter]);

  const fetchData = async () => {
    if (!user?.employeeId) {
      console.log('No employeeId found, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Admin/HR Manager see all requests, employees see only their own
      const isAdminOrHR = user.role === 'ADMIN' || user.role === 'HR_MANAGER';

      // Build query params
      const queryParams: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (statusFilter !== 'ALL') {
        queryParams.status = statusFilter;
      }

      if (leaveTypeFilter !== 'ALL') {
        queryParams.leaveType = leaveTypeFilter;
      }

      const [balanceRes, requestsRes] = await Promise.all([
        leaveService.getBalance(user.employeeId).catch(err => {
          console.error('Failed to fetch balance:', err);
          return { data: null };
        }),
        isAdminOrHR
          ? leaveService.getAll(queryParams).catch(err => {
            console.error('Failed to fetch all requests:', err);
            return { data: [], meta: { total: 0, page: 1, limit: itemsPerPage, totalPages: 1 } };
          })
          : leaveService.getMyRequests().catch(err => {
            console.error('Failed to fetch my requests:', err);
            return { data: [] };
          }),
      ]);

      setBalance(balanceRes.data);

      if (isAdminOrHR && requestsRes.meta) {
        setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        setTotalRecords(requestsRes.meta.total || 0);
        setTotalPages(requestsRes.meta.totalPages || 1);
      } else {
        // For employees, filter locally
        let filteredRequests = Array.isArray(requestsRes.data) ? requestsRes.data : [];

        if (statusFilter !== 'ALL') {
          filteredRequests = filteredRequests.filter(r => r.status === statusFilter);
        }

        if (leaveTypeFilter !== 'ALL') {
          filteredRequests = filteredRequests.filter(r => r.leaveType === leaveTypeFilter);
        }

        setTotalRecords(filteredRequests.length);
        setTotalPages(Math.ceil(filteredRequests.length / itemsPerPage));

        // Paginate locally
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setRequests(filteredRequests.slice(startIndex, endIndex));
      }
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      setBalance(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-700 border-green-200',
      REJECTED: 'bg-red-100 text-red-700 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
      CANCELLED: AlertCircle,
    };
    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 whitespace-nowrap ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        <Icon size={14} />
        {status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : 'Đã hủy'}
      </span>
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page
  };

  const handleLeaveTypeFilterChange = (type: string) => {
    setLeaveTypeFilter(type);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="text-green-600" size={24} />
              <div className="flex-1">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <XCircle size={20} />
              </button>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary">Nghỉ phép</h1>
              <p className="text-slate-500 mt-1">Quản lý đơn nghỉ phép và số dư phép năm</p>
            </div>
            <div className="flex items-center gap-3">
              {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'MANAGER') && (
                <button
                  onClick={() => router.push('/dashboard/leaves/pending')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-all"
                >
                  <Clock size={20} />
                  Đơn chờ duyệt
                </button>
              )}
              {can('CREATE_LEAVE') && (
                <button
                  onClick={() => router.push('/dashboard/leaves/new')}
                  className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                  Tạo đơn mới
                </button>
              )}
            </div>
          </div>

          {/* Leave Balance Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
                  <div className="h-20 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Annual Leave */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brandBlue rounded-2xl p-6 text-white relative overflow-hidden border-2 border-brandBlue/20"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Calendar size={24} />
                    </div>
                    <p className="text-white/80 text-sm">Phép năm</p>
                  </div>
                  <p className="text-4xl font-bold">{balance ? (balance.remainingAnnual ?? (balance.annualLeave + balance.carriedOver - balance.usedAnnual)) : 0}</p>
                  <p className="text-white/70 text-sm mt-2">
                    Còn lại / {balance ? (balance.annualLeave + balance.carriedOver) : 0} ngày
                  </p>
                </div>
              </motion.div>

              {/* Sick Leave */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 border-2 border-brandBlue/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Calendar className="text-green-600" size={24} />
                  </div>
                  <p className="text-slate-600 text-sm">Phép bệnh</p>
                </div>
                <p className="text-4xl font-bold text-primary">{balance ? (balance.remainingSick ?? (balance.sickLeave - balance.usedSick)) : 0}</p>
                <p className="text-slate-500 text-sm mt-2">
                  Còn lại / {balance?.sickLeave || 0} ngày
                </p>
              </motion.div>

              {/* Carried Over */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border-2 border-secondary/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="text-secondary" size={24} />
                  </div>
                  <p className="text-slate-600 text-sm">Phép cộng dồn</p>
                </div>
                <p className="text-4xl font-bold text-primary">{balance?.carriedOver || 0}</p>
                <p className="text-slate-500 text-sm mt-2">
                  Từ năm trước
                </p>
              </motion.div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-slate-500" />
                <span className="font-semibold text-slate-700">Lọc:</span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-sm"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              {/* Leave Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Loại phép:</span>
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => handleLeaveTypeFilterChange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-sm"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="ANNUAL">Phép năm</option>
                  <option value="SICK">Phép bệnh</option>
                  <option value="UNPAID">Không lương</option>
                  <option value="MATERNITY">Thai sản</option>
                  <option value="PATERNITY">Chăm con</option>
                  <option value="BEREAVEMENT">Tang lễ</option>
                </select>
              </div>

              <div className="ml-auto text-sm text-slate-600">
                Tổng: <span className="font-semibold text-brandBlue">{totalRecords}</span> đơn
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-primary">Danh sách đơn nghỉ phép</h2>
              <p className="text-sm text-slate-500 mt-1">
                Trang {currentPage} / {totalPages} - Hiển thị {requests.length} / {totalRecords} đơn
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Loại phép
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Từ ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Đến ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Số ngày
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Lý do
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full"></div></td>
                      </tr>
                    ))
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        Không tìm thấy đơn nghỉ phép nào
                      </td>
                    </tr>
                  ) : (
                    requests.map((request, index) => (
                      <motion.tr
                        key={request.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => router.push(`/dashboard/leaves/${request.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold text-xs">
                                {request.employee?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-primary">{request.employee?.fullName || 'N/A'}</p>
                                <p className="text-xs text-slate-500">{request.employee?.employeeCode || ''}</p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-primary">
                            {request.leaveType === 'ANNUAL' ? 'Phép năm' :
                              request.leaveType === 'SICK' ? 'Phép bệnh' :
                                request.leaveType === 'UNPAID' ? 'Không lương' :
                                  request.leaveType === 'MATERNITY' ? 'Thai sản' :
                                    request.leaveType === 'PATERNITY' ? 'Chăm con' :
                                      request.leaveType === 'BEREAVEMENT' ? 'Tang lễ' : request.leaveType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.startDate)}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{formatDate(request.endDate)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-brandBlue">{request.totalDays}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600 line-clamp-1">{request.reason}</p>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/leaves/${request.id}`);
                            }}
                            className="text-brandBlue hover:text-blue-700 font-medium text-sm"
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalRecords)} của {totalRecords} đơn
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${page === currentPage
                                ? 'bg-brandBlue text-white'
                                : 'border border-slate-200 hover:bg-slate-50'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng đơn', value: totalRecords.toString(), color: 'blue' },
              { label: 'Chờ duyệt', value: String(requests.filter(r => r.status === 'PENDING').length), color: 'yellow' },
              { label: 'Đã duyệt', value: String(requests.filter(r => r.status === 'APPROVED').length), color: 'green' },
              { label: 'Từ chối', value: String(requests.filter(r => r.status === 'REJECTED').length), color: 'red' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-slate-200"
              >
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
