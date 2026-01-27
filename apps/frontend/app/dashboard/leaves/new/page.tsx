'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Calendar, Save } from 'lucide-react';
import leaveService from '@/services/leaveService';
import { useAuthStore } from '@/store/authStore';
import { LeaveBalance } from '@/types/leave';

const leaveSchema = z.object({
  leaveType: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT']),
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

export default function NewLeavePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      leaveType: 'ANNUAL',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    if (!user?.employeeId) return;

    try {
      setLoading(true);
      const response = await leaveService.getBalance(user.employeeId);
      setBalance(response.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const onSubmit = async (data: LeaveFormData) => {
    try {
      setSubmitting(true);
      await leaveService.create(data);
      alert('Tạo đơn nghỉ phép thành công');
      router.push('/dashboard/leaves');
    } catch (error: any) {
      console.error('Failed to create leave request:', error);
      alert(error.response?.data?.message || 'Tạo đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedDays = calculateDays();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary">Tạo đơn nghỉ phép</h1>
            <p className="text-slate-500 mt-1">Điền thông tin để gửi yêu cầu nghỉ phép</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại phép <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('leaveType')}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                >
                  <option value="ANNUAL">Phép năm</option>
                  <option value="SICK">Phép bệnh</option>
                  <option value="UNPAID">Không lương</option>
                  <option value="MATERNITY">Thai sản</option>
                  <option value="PATERNITY">Chăm con</option>
                  <option value="BEREAVEMENT">Tang lễ</option>
                </select>
                {errors.leaveType && (
                  <p className="text-red-500 text-sm mt-1">{errors.leaveType.message}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Từ ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Đến ngày <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                  {errors.endDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {/* Estimated Days */}
              {estimatedDays > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Số ngày dự kiến:</span> {estimatedDays} ngày
                    <span className="text-xs ml-2">(Bao gồm cả cuối tuần, hệ thống sẽ tính chính xác khi duyệt)</span>
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lý do <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('reason')}
                  rows={6}
                  placeholder="Nhập lý do nghỉ phép chi tiết..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Gửi đơn
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>

          {/* Balance Info */}
          <div className="space-y-4">
            {/* Annual Leave Balance */}
            <div className="bg-gradient-to-br from-brandBlue to-[#0047b3] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <p className="text-white/80 text-sm">Phép năm còn lại</p>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/20 rounded w-2/3"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold">
                    {balance ? (balance.remainingAnnual ?? (balance.annualLeave + balance.carriedOver - balance.usedAnnual)) : 0}
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    / {balance ? (balance.annualLeave + balance.carriedOver) : 0} ngày
                  </p>
                </>
              )}
            </div>

            {/* Sick Leave Balance */}
            <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Calendar className="text-green-600" size={24} />
                </div>
                <p className="text-slate-600 text-sm">Phép bệnh còn lại</p>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-slate-100 rounded mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-primary">
                    {balance ? (balance.remainingSick ?? (balance.sickLeave - balance.usedSick)) : 0}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    / {balance?.sickLeave || 0} ngày
                  </p>
                </>
              )}
            </div>

            {/* Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800 font-medium mb-2">📌 Lưu ý:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Phép năm cần đăng ký trước 3 ngày</li>
                <li>• Phép bệnh cần có giấy xác nhận</li>
                <li>• Hệ thống tự động trừ cuối tuần và ngày lễ</li>
                <li>• Đơn sẽ được gửi đến quản lý duyệt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
