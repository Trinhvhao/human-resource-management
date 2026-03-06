'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import attendanceService from '@/services/attendanceService';
import faceRecognitionService from '@/services/faceRecognitionService';
import { FaceCheckIn } from '@/components/face-recognition';
import { ScanFace, Clock, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [faceCheckInMode, setFaceCheckInMode] = useState<'check-in' | 'check-out' | null>(null);
  const [faceRegistered, setFaceRegistered] = useState<boolean | null>(null);
  const [faceCount, setFaceCount] = useState(0);

  useEffect(() => {
    loadMyAttendances();
    loadTodayAttendance();
    checkFaceRegistration();
  }, []);

  const checkFaceRegistration = async () => {
    try {
      const response = await faceRecognitionService.getRegistrationStatus();
      const data = (response as any).data;
      setFaceRegistered(data.isRegistered);
      setFaceCount(data.totalRegistered);
    } catch (error) {
      console.error('Failed to check face registration:', error);
      setFaceRegistered(false);
    }
  };

  const loadTodayAttendance = async () => {
    try {
      const res = await attendanceService.getTodayAttendance();
      const rec = (res as any)?.data ?? (res as any) ?? null;
      setTodayRecord(rec);
    } catch {
      setTodayRecord(null);
    }
  };

  const loadMyAttendances = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const data = await attendanceService.getMyAttendances(
        now.getMonth() + 1,
        now.getFullYear()
      );
      const records = (data as any)?.data?.data || (data as any)?.data || [];
      setAttendances(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Failed to load attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceSuccess = () => {
    loadTodayAttendance();
    loadMyAttendances();
  };

  const handleFaceClose = () => {
    setFaceCheckInMode(null);
    loadTodayAttendance();
    loadMyAttendances();
  };

  // Use dedicated today endpoint for reliable lock state; fall back to month list
  const todayAttendance = todayRecord ?? attendances.find(
    a => new Date(a.date).toDateString() === new Date().toDateString()
  );

  // Face check-in modal
  if (faceCheckInMode) {
    return (
      <DashboardLayout>
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <FaceCheckIn
              mode={faceCheckInMode}
              onSuccess={handleFaceSuccess}
              onClose={handleFaceClose}
            />
          </div>
        </div>
      </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chấm công của tôi</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Face Registration Status Banner */}
      {faceRegistered === false && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800">Chưa đăng ký nhận diện khuôn mặt</p>
                <p className="text-sm text-amber-600">Đăng ký khuôn mặt để có thể chấm công bằng nhận diện</p>
              </div>
            </div>
            <Link
              href="/dashboard/face-recognition"
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <ScanFace className="h-4 w-4" />
              Đăng ký ngay
            </Link>
          </div>
        </div>
      )}

      {/* Check In/Out Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Chấm công hôm nay</h2>
        
        {/* Time display */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Giờ vào</p>
            <p className="text-2xl font-bold text-gray-900">
              {todayAttendance?.checkIn 
                ? new Date(todayAttendance.checkIn).toLocaleTimeString('vi-VN')
                : '--:--'}
            </p>
            {todayAttendance?.isLate && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Đi muộn</span>
            )}
          </div>
          
          <div className="flex-1 rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Giờ ra</p>
            <p className="text-2xl font-bold text-gray-900">
              {todayAttendance?.checkOut 
                ? new Date(todayAttendance.checkOut).toLocaleTimeString('vi-VN')
                : '--:--'}
            </p>
            {todayAttendance?.isEarlyLeave && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">Về sớm</span>
            )}
          </div>

          <div className="flex-1 rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Số giờ làm</p>
            <p className="text-2xl font-bold text-gray-900">
              {todayAttendance?.workHours || 0}h
            </p>
          </div>
        </div>

        {/* Status banners */}
        {todayAttendance?.checkOut ? (
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-center">
            <p className="text-lg font-bold text-green-700">✅ Đã hoàn thành chấm công hôm nay</p>
            <p className="mt-1 text-sm text-green-600">
              Vào: {new Date(todayAttendance.checkIn).toLocaleTimeString('vi-VN')}{' '}·{' '}
              Ra: {new Date(todayAttendance.checkOut).toLocaleTimeString('vi-VN')}
              {todayAttendance.workHours ? ` · ${todayAttendance.workHours}h làm việc` : ''}
            </p>
          </div>
        ) : todayAttendance?.checkIn ? (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold text-blue-700">
              🟢 Đã chấm công vào lúc {new Date(todayAttendance.checkIn).toLocaleTimeString('vi-VN')}
              {todayAttendance.isLate && <span className="ml-2 rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">Đi muộn</span>}
            </p>
            <p className="mt-0.5 text-sm text-blue-600">Nhớ chấm công ra trước khi về nhé!</p>
          </div>
        ) : null}

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Face Recognition buttons */}
          {!todayAttendance?.checkOut && (
          <div className="flex gap-3">
            <button
              onClick={() => setFaceCheckInMode('check-in')}
              disabled={!faceRegistered || !!todayAttendance?.checkIn}
              title={!!todayAttendance?.checkIn ? 'Đã chấm công vào hôm nay' : ''}
              className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-green-600 to-emerald-600 text-white px-6 py-3.5 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
            >
              <ScanFace className="h-5 w-5" />
              Chấm công vào
            </button>

            <button
              onClick={() => setFaceCheckInMode('check-out')}
              disabled={!faceRegistered || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
              title={!todayAttendance?.checkIn ? 'Chưa chấm công vào' : !!todayAttendance?.checkOut ? 'Đã chấm công ra hôm nay' : ''}
              className="flex-1 flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-medium shadow-sm transition-all"
            >
              <ScanFace className="h-5 w-5" />
              Chấm công ra
            </button>
          </div>
          )}

          {/* Face registration link */}
          {faceRegistered !== null && (
            <div className="flex items-center justify-center pt-2">
              <Link
                href="/dashboard/face-recognition"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
                {faceRegistered 
                  ? `Quản lý khuôn mặt (${faceCount} ảnh)` 
                  : 'Đăng ký nhận diện khuôn mặt'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Lịch sử chấm công tháng này</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Chưa có dữ liệu chấm công trong tháng này
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ vào</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giờ ra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số giờ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(attendance.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {attendance.checkIn 
                        ? new Date(attendance.checkIn).toLocaleTimeString('vi-VN')
                        : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {attendance.checkOut 
                        ? new Date(attendance.checkOut).toLocaleTimeString('vi-VN')
                        : '--:--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {attendance.workHours != null && Number(attendance.workHours) > 0
                        ? `${Number(attendance.workHours).toFixed(2).replace(/\.?0+$/, '')}h`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {attendance.status === 'ABSENT' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Vắng mặt</span>
                      ) : attendance.status === 'LEAVE' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Nghỉ phép</span>
                      ) : attendance.isLate && attendance.isEarlyLeave ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Đi muộn + Về sớm</span>
                      ) : attendance.isLate ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Đi muộn</span>
                      ) : attendance.isEarlyLeave ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Về sớm</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Đúng giờ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
