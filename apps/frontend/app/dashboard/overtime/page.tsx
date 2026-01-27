'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import overtimeService from '@/services/overtimeService';
import { Overtime } from '@/types/overtime';
import { useAuthStore } from '@/store/authStore';

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700 border-2 border-green-200' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700 border-2 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-2 border-gray-200' },
};

export default function OvertimePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [overtimes, setOvertimes] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalHours: 0,
  });

  useEffect(() => {
    fetchOvertimes();
  }, []);

  const fetchOvertimes = async () => {
    try {
      setLoading(true);
      
      // Admin/HR Manager see all requests, employees see only their own
      const isAdminOrHR = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
      
      const response = await (isAdminOrHR 
        ? overtimeService.getAll() 
        : overtimeService.getMyRequests()
      );
      
      const data = Array.isArray(response.data) ? response.data : [];
      setOvertimes(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to fetch overtimes:', error);
      setOvertimes([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Overtime[]) => {
    if (!Array.isArray(data)) {
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0, totalHours: 0 });
      return;
    }

    setStats({
      total: data.length,
      pending: data.filter(o => o.status === 'PENDING').length,
      approved: data.filter(o => o.status === 'APPROVED').length,
      rejected: data.filter(o => o.status === 'REJECTED').length,
      totalHours: data.filter(o => o.status === 'APPROVED').reduce((sum, o) => sum + o.hours, 0),
    });
  };

  const filteredOvertimes = Array.isArray(overtimes) 
    ? (filter === 'all' ? overtimes : overtimes.filter(o => o.status === filter))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Quản lý Tăng ca</h1>
            <p className="text-slate-500 mt-1">Đăng ký và theo dõi đơn tăng ca</p>
          </div>

          <button
            onClick={() => router.push('/dashboard/overtime/new')}
            className="flex items-center gap-2 px-6 py-3 bg-brandBlue text-white rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Đăng ký tăng ca
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-brandBlue" size={20} />
              </div>
              <p className="text-sm text-slate-600">Tổng đơn</p>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Chờ duyệt</p>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Đã duyệt</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="text-red-600" size={20} />
              </div>
              <p className="text-sm text-slate-600">Từ chối</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </div>

          <div className="bg-brandBlue rounded-xl p-6 text-white border-2 border-brandBlue/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock size={20} />
              </div>
              <p className="text-sm text-white/80">Tổng giờ</p>
            </div>
            <p className="text-3xl font-bold">{stats.totalHours}h</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-brandBlue text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {status === 'all' ? 'Tất cả' : statusLabels[status].label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nhân viên</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Thời gian</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Số giờ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Lý do</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Trạng thái</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredOvertimes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không có đơn tăng ca
                    </td>
                  </tr>
                ) : (
                  filteredOvertimes.map((overtime) => (
                    <tr key={overtime.id} className="hover:bg-slate-50 transition-colors">
                      {(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold text-xs">
                              {overtime.employee?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NA'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">{overtime.employee?.fullName || 'N/A'}</p>
                              <p className="text-xs text-slate-500">{overtime.employee?.employeeCode || ''}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {new Date(overtime.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {new Date(overtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(overtime.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-brandBlue">{overtime.hours}h</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {overtime.reason}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 whitespace-nowrap ${statusLabels[overtime.status].color}`}>
                          {statusLabels[overtime.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => router.push(`/dashboard/overtime/${overtime.id}`)}
                          className="text-brandBlue hover:underline text-sm font-medium"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
