'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  User,
  Clock,
  Shield,
  Zap,
  RefreshCw,
} from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import faceRecognitionService from '@/services/faceRecognitionService';
import { useAuthStore } from '@/store/authStore';

interface FaceCheckInProps {
  mode: 'check-in' | 'check-out';
  onSuccess?: (result: any) => void;
  onClose?: () => void;
}

export default function FaceCheckIn({ mode, onSuccess, onClose }: FaceCheckInProps) {
  const { user } = useAuthStore();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    employee: any;
    attendance: any;
    recognition: any;
    message: string;
  } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Start countdown once result arrives
  useEffect(() => {
    if (result && countdown === null) {
      setCountdown(4);
    }
  }, [result]);

  // Tick countdown → auto-close at 0
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      onClose?.();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown, onClose]);

  const handleCapture = useCallback(
    async (imageBase64: string) => {
      try {
        setProcessing(true);
        setError(null);

        const response =
          mode === 'check-in'
            ? await faceRecognitionService.faceCheckIn(imageBase64)
            : await faceRecognitionService.faceCheckOut(imageBase64);

        // Axios interceptor unwraps one level → { success, message, data }
        const outer = response as any;
        const data = outer?.data ?? outer;
        const currentEmployeeId = user?.employeeId || user?.employee?.id;

        // Safety guard: if API returns another employee, do not proceed.
        if (currentEmployeeId && data?.employee?.id && data.employee.id !== currentEmployeeId) {
          setError('Khuôn mặt không khớp với tài khoản đăng nhập. Vui lòng kiểm tra lại dữ liệu khuôn mặt.');
          return;
        }

        setResult({
          employee: data?.employee,
          attendance: data?.attendance,
          recognition: data?.recognition,
          message:
            outer?.message ||
            (mode === 'check-in' ? 'Chấm công vào thành công!' : 'Chấm công ra thành công!'),
        });

        onSuccess?.(data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Nhận diện thất bại. Vui lòng thử lại.';
        setError(msg);
      } finally {
        setProcessing(false);
      }
    },
    [mode, onSuccess, user],
  );

  const isCheckIn = mode === 'check-in';

  // ── SUCCESS SCREEN ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col items-center gap-5 py-4">
        {/* Big check icon */}
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            isCheckIn ? 'bg-green-100' : 'bg-blue-100'
          }`}
        >
          <CheckCircle
            className={`h-14 w-14 ${isCheckIn ? 'text-green-500' : 'text-blue-500'}`}
          />
        </div>

        <div className="text-center">
          <h3
            className={`text-2xl font-bold ${isCheckIn ? 'text-green-700' : 'text-blue-700'}`}
          >
            {isCheckIn ? 'Chấm công vào thành công!' : 'Chấm công ra thành công!'}
          </h3>
          <div className="mt-1.5 flex justify-center gap-2">
            {result.attendance?.isLate && (
              <span className="inline-block rounded-full bg-yellow-100 px-3 py-0.5 text-sm text-yellow-700">
                ⚠ Đi muộn
              </span>
            )}
            {result.attendance?.isEarlyLeave && (
              <span className="inline-block rounded-full bg-orange-100 px-3 py-0.5 text-sm text-orange-700">
                ⚠ Về sớm
              </span>
            )}
          </div>
        </div>

        {/* Employee card */}
        {result.employee && (
          <div
            className={`w-full max-w-sm rounded-xl border-2 p-5 ${
              isCheckIn
                ? 'border-green-200 bg-green-50'
                : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              {result.employee.avatarUrl ? (
                <img
                  src={result.employee.avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isCheckIn ? 'bg-green-200' : 'bg-blue-200'
                  }`}
                >
                  <User
                    className={`h-6 w-6 ${isCheckIn ? 'text-green-700' : 'text-blue-700'}`}
                  />
                </div>
              )}
              <div>
                <p
                  className={`text-lg font-bold ${
                    isCheckIn ? 'text-green-800' : 'text-blue-800'
                  }`}
                >
                  {result.employee.fullName}
                </p>
                <p className={`text-sm ${isCheckIn ? 'text-green-600' : 'text-blue-600'}`}>
                  {result.employee.employeeCode}
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                isCheckIn ? 'text-green-700' : 'text-blue-700'
              }`}
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {isCheckIn
                  ? `Giờ vào: ${result.attendance?.checkInTime ?? new Date().toLocaleTimeString('vi-VN')}`
                  : `Giờ ra: ${result.attendance?.checkOutTime ?? new Date().toLocaleTimeString('vi-VN')}`}
              </span>
            </div>

            {!isCheckIn && result.attendance?.workHours != null && (
              <div
                className={`mt-1.5 flex items-center gap-2 text-sm ${
                  isCheckIn ? 'text-green-700' : 'text-blue-700'
                }`}
              >
                <Zap className="h-4 w-4 shrink-0" />
                <span>Tổng giờ làm: {result.attendance.workHours}h</span>
              </div>
            )}
          </div>
        )}

        {/* Recognition stats */}
        {result.recognition && (
          <div className="flex gap-5 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>
                Tin cậy: <strong className="text-gray-700">{result.recognition.confidence}%</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>
                Chất lượng: <strong className="text-gray-700">{result.recognition.quality}%</strong>
              </span>
            </div>
          </div>
        )}

        {/* Countdown close button */}
        <button
          onClick={onClose}
          className={`mt-1 flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white transition-all ${
            isCheckIn ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Hoàn tất
          {countdown !== null && countdown > 0 && (
            <span className="rounded-full bg-white/30 px-2 py-0.5 text-xs">{countdown}s</span>
          )}
        </button>
      </div>
    );
  }

  // ── CAMERA SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${isCheckIn ? 'bg-green-100' : 'bg-blue-100'}`}>
            {isCheckIn ? (
              <LogIn className="h-6 w-6 text-green-600" />
            ) : (
              <LogOut className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {isCheckIn ? 'Chấm công vào' : 'Chấm công ra'}
            </h3>
            <p className="text-sm text-gray-500">Nhìn thẳng vào camera rồi nhấn chụp</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="font-medium text-red-700">Không thể chấm công</p>
            <p className="mt-0.5 text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            <RefreshCw className="mr-1 inline h-3 w-3" />
            Thử lại
          </button>
        </div>
      )}

      {/* Tip */}
      {!error && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            isCheckIn ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          💡 Giữ khuôn mặt trong khung hình, đảm bảo đủ ánh sáng, nhìn thẳng vào camera
        </div>
      )}

      {/* Camera — showPreview=false keeps it live; scanning overlay added inside WebcamCapture */}
      <WebcamCapture
        onCapture={handleCapture}
        isProcessing={processing}
        showPreview={false}
        buttonText={isCheckIn ? 'Chấm công vào' : 'Chấm công ra'}
        width={480}
        height={360}
      />
    </div>
  );
}
