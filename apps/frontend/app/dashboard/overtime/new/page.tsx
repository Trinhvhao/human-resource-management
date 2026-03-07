'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Save, Clock, AlertCircle } from 'lucide-react';
import overtimeService from '@/services/overtimeService';

const overtimeSchema = z.object({
  date: z.string().min(1, 'Ngày là bắt buộc'),
  startTime: z.string().min(1, 'Giờ bắt đầu là bắt buộc'),
  endTime: z.string().min(1, 'Giờ kết thúc là bắt buộc'),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
});

type OvertimeFormData = z.infer<typeof overtimeSchema>;

export default function NewOvertimePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OvertimeFormData>({
    resolver: zodResolver(overtimeSchema),
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const date = watch('date');

  const calculateHours = () => {
    if (!startTime || !endTime || !date) return 0;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) return 0;

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10;
  };

  const estimatedHours = calculateHours();

  const onSubmit = async (data: OvertimeFormData) => {
    try {
      setSubmitting(true);

      const hours = calculateHours();
      if (hours <= 0) {
        alert('Giờ kết thúc phải sau giờ bắt đầu');
        return;
      }

      await overtimeService.create({
        date: data.date,
        startTime: `${data.date}T${data.startTime}:00Z`,
        endTime: `${data.date}T${data.endTime}:00Z`,
        hours,
        reason: data.reason,
      });

      alert('Đăng ký tăng ca thành công');
      router.push('/dashboard/overtime');
    } catch (error: any) {
      console.error('Failed to create overtime:', error);
      // Handle different error structures
      let errorMessage = 'Đăng ký tăng ca thất bại';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-secondary">Đăng ký Tăng ca</h1>
            <p className="text-slate-500 mt-1">Điền thông tin để đăng ký tăng ca</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ngày tăng ca <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('date')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('startTime')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                  {errors.startTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    {...register('endTime')}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
                  />
                  {errors.endTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Estimated Hours */}
              {estimatedHours > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-blue-600" size={20} />
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">Số giờ dự kiến:</span> {estimatedHours} giờ
                    </p>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lý do tăng ca <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('reason')}
                  rows={6}
                  placeholder="Nhập lý do tăng ca chi tiết..."
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

          {/* Info */}
          <div className="space-y-4">
            {/* Guidelines */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="text-yellow-600" size={20} />
                <h3 className="font-bold text-yellow-800">Lưu ý quan trọng</h3>
              </div>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Giờ tăng ca phải ngoài giờ hành chính (8:30-17:30)</li>
                <li>• Tối đa 30 giờ/tháng và 200 giờ/năm</li>
                <li>• Đơn cần được duyệt trước khi tăng ca</li>
                <li>• Lương tăng ca = 150% lương giờ</li>
              </ul>
            </div>

            {/* Overtime Rates */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="font-bold text-primary mb-4">Mức lương tăng ca</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ngày thường</span>
                  <span className="font-bold text-brandBlue">150%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Cuối tuần</span>
                  <span className="font-bold text-brandBlue">200%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Ngày lễ</span>
                  <span className="font-bold text-brandBlue">300%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
