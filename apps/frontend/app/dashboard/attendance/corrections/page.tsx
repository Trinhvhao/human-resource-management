'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Plus, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import attendanceService from '@/services/attendanceService';
import { useAuthStore } from '@/store/authStore';
import { AttendanceCorrection } from '@/types/attendance';
import { formatDate, formatTime } from '@/utils/formatters';

export default function AttendanceCorrectionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    requestedCheckIn: '',
    requestedCheckOut: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCorrections();
  }, []);

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getMyCorrections();
      setCorrections(response.data);
    } catch (error) {
      console.error('Failed to fetch corrections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.reason) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!formData.requestedCheckIn && !formData.requestedCheckOut) {
      alert('Vui lòng điền ít nhất giờ check-in hoặc check-out');
      return;
    }

    try {
      setSubmitting(true);
      await attendanceService.createCorrection({
        date: formData.date,
        requestedCheckIn: formData.requestedCheckIn || undefined,
        requestedCheckOut: formData.requestedCheckOut || undefined,
        reason: formData.reason
      });
      
      alert('Tạo yêu cầu điều chỉnh thành công');
      setShowCreateModal(false);
      setFormData({ date: '', requestedCheckIn: '', requestedCheckOut: '', reason: '' });
      fetchCorrections();
    } catch (error: any) {
      console.error('Failed to create correction:', error);
      alert(error.response?.data?.message || 'Tạo yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) return;

    try {
      await attendanceService.cancelCorrection(id);
      alert('Hủy yêu cầu thành công');
      fetchCorrections();
    } catch (error: any) {
      console.error('Failed to cancel correction:', error);
      alert(error.response?.data?.message || 'Hủy yêu cầu thất bại');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-100 text-slate-700'
    };
    const labels = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

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
              <h1 className="text-3xl font-bold text-primary">Điều chỉnh chấm công</h1>
              <p className="text-slate-500 mt-1">Yêu cầu điều chỉnh giờ check-in/check-out</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Tạo yêu cầu
          </button>
        </div>

        {/* Corrections List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Giờ gốc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Giờ yêu cầu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Lý do</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
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
                      <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                    </tr>
                  ))
                ) : corrections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Chưa có yêu cầu điều chỉnh nào
                    </td>
                  </tr>
                ) : (
                  corrections.map((correction, index) => (
                    <motion.tr
                      key={correction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-primary">
                        {formatDate(correction.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="space-y-1">
                          <div>In: {correction.originalCheckIn ? formatTime(correction.originalCheckIn) : '--:--'}</div>
                          <div>Out: {correction.originalCheckOut ? formatTime(correction.originalCheckOut) : '--:--'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-brandBlue">
                        <div className="space-y-1">
                          <div>In: {correction.requestedCheckIn ? formatTime(correction.requestedCheckIn) : '--:--'}</div>
                          <div>Out: {correction.requestedCheckOut ? formatTime(correction.requestedCheckOut) : '--:--'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                        {correction.reason}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(correction.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {correction.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(correction.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Hủy
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-primary mb-6">Tạo yêu cầu điều chỉnh</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ngày cần điều chỉnh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                </div>

                {/* Check-in Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ check-in
                  </label>
                  <input
                    type="time"
                    value={formData.requestedCheckIn}
                    onChange={(e) => setFormData({ ...formData, requestedCheckIn: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                </div>

                {/* Check-out Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ check-out
                  </label>
                  <input
                    type="time"
                    value={formData.requestedCheckOut}
                    onChange={(e) => setFormData({ ...formData, requestedCheckOut: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Lý do <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={4}
                    required
                    placeholder="Giải thích lý do cần điều chỉnh chấm công..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
