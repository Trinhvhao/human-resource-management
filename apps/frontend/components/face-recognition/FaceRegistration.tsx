'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  UserCheck,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  Shield,
  ChevronLeft,
  ChevronRight,
  Focus,
} from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import faceRecognitionService from '@/services/faceRecognitionService';
import type { FaceDescriptorInfo } from '@/services/faceRecognitionService';

interface FaceRegistrationProps {
  employeeId?: string;
  employeeName?: string;
  onRegistrationComplete?: () => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

export default function FaceRegistration({
  employeeId,
  employeeName,
  onRegistrationComplete,
}: FaceRegistrationProps) {
  const [descriptors, setDescriptors] = useState<FaceDescriptorInfo[]>([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [mode, setMode] = useState<'list' | 'webcam' | 'upload'>('list');

  // Guided step for the 3 mandatory captures (0=front, 1=left, 2=right)
  const REQUIRED_STEPS = [
    {
      label: 'Bước 1/3 — Chính diện',
      hint: 'Nhìn thẳng vào camera, giữ đầu thẳng',
      icon: <Focus className="h-6 w-6" />,
      color: 'blue',
    },
    {
      label: 'Bước 2/3 — Nghiêng nhẹ sang trái',
      hint: 'Xoay đầu nhẹ sang trái khoảng 15-20°',
      icon: <ChevronLeft className="h-6 w-6" />,
      color: 'purple',
    },
    {
      label: 'Bước 3/3 — Nghiêng nhẹ sang phải',
      hint: 'Xoay đầu nhẹ sang phải khoảng 15-20°',
      icon: <ChevronRight className="h-6 w-6" />,
      color: 'indigo',
    },
  ];

  const loadDescriptors = useCallback(async () => {
    try {
      setLoading(true);
      const response = employeeId
        ? await faceRecognitionService.getEmployeeDescriptors(employeeId)
        : await faceRecognitionService.getMyDescriptors();

      // Axios interceptor unwraps response.data → { success, data: [...] }
      const raw = (response as any).data ?? response;
      // Backend returns plain array in data field
      const descriptorsList: FaceDescriptorInfo[] = Array.isArray(raw)
        ? raw
        : (raw?.descriptors || []);
      setDescriptors(descriptorsList);
      setTotalRegistered(
        Array.isArray(raw) ? descriptorsList.length : (raw?.totalRegistered ?? descriptorsList.length)
      );
      setMaxAllowed(
        Array.isArray(raw) ? 3 : (raw?.maxAllowed || 3)
      );
    } catch (error) {
      console.error('Failed to load descriptors:', error);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadDescriptors();
  }, [loadDescriptors]);

  const handleCapture = async (imageBase64: string) => {
    try {
      setRegistering(true);
      setMessage(null);

      const response = await faceRecognitionService.registerFace(
        imageBase64,
        employeeId,
      );

      // Axios interceptor unwraps response.data → outer: { success, message, data: {...} }
      const outer = response as any;
      const inner = outer?.data ?? outer;
      const successMsg = outer?.message || inner?.message || 'Đăng ký khuôn mặt thành công';
      // quality is a 0-1 float from the backend
      const qualityPct = Math.round((inner?.quality ?? 0) * 100);

      setMessage({
        type: 'success',
        text: `${successMsg} (Chất lượng: ${qualityPct}%)`,
      });

      await loadDescriptors();

      const totalDone = inner?.totalRegistered ?? 0;
      if (totalDone >= 3) {
        onRegistrationComplete?.();
        // All required steps done → go back to list
        setTimeout(() => setMode('list'), 1200);
      }
      // else: stay in webcam mode → next required step will be shown automatically
    } catch (error: any) {
      const errMsg = error?.message || error?.data?.message || 'Đăng ký khuôn mặt thất bại';
      setMessage({
        type: 'error',
        text: errMsg,
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleCapture(base64);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleDelete = async (descriptorId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh khuôn mặt này?')) return;

    try {
      setDeleting(descriptorId);
      await faceRecognitionService.deleteDescriptor(descriptorId);
      setMessage({ type: 'success', text: 'Đã xóa ảnh khuôn mặt' });
      await loadDescriptors();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Xóa thất bại',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Đăng ký khuôn mặt
              {employeeName && (
                <span className="text-blue-600"> - {employeeName}</span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              Đã đăng ký {totalRegistered}/3 ảnh bắt buộc
              {totalRegistered >= 3 && maxAllowed > 3 && ` (tối đa ${maxAllowed})`}
            </p>
          </div>
        </div>

        {/* Progress indicator — 3 required slots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full ${i < totalRegistered ? 'bg-green-500' : 'bg-gray-200'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Status message - only show in list mode; webcam mode has its own inline messages */}
      {message && mode === 'list' && (
        <div
          className={`flex items-center gap-2 rounded-lg p-4 ${message.type === 'success'
            ? 'border border-green-200 bg-green-50 text-green-700'
            : 'border border-red-200 bg-red-50 text-red-700'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Registration tip */}
      {totalRegistered < 3 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            💡 Mẹo đăng ký khuôn mặt:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
            <li>Đăng ký ít nhất 3 ảnh để tăng độ chính xác</li>
            <li>Chụp ở nhiều góc độ khác nhau (thẳng, nghiêng nhẹ trái/phải)</li>
            <li>Đảm bảo ánh sáng đầy đủ, không bị tối hoặc ngược sáng</li>
            <li>Nhìn thẳng vào camera, không đeo kính đen hay khẩu trang</li>
          </ul>
        </div>
      )}

      {/* Mode: List */}
      {mode === 'list' && (
        <div>
          {/* Registered faces grid */}
          {descriptors.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {descriptors.map((desc) => (
                <div
                  key={desc.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                >
                  {getImageUrl(desc.imageUrl) ? (
                    <img
                      src={getImageUrl(desc.imageUrl)!}
                      alt="Face"
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gray-100">
                      <UserCheck className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-500">
                      CL: {Math.round(desc.quality * 100)}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(desc.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(desc.id)}
                    disabled={deleting === desc.id}
                    className="absolute right-1 top-1 rounded-full bg-red-500/80 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  >
                    {deleting === desc.id ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add more faces buttons */}
          {totalRegistered < maxAllowed && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setMessage(null); setMode('webcam'); }}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <ImagePlus className="h-5 w-5" />
                {totalRegistered < 3
                  ? `Bắt đầu đăng ký (bước ${totalRegistered + 1}/3)`
                  : 'Chụp thêm ảnh'}
              </button>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <Upload className="h-5 w-5" />
                Upload ảnh
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {totalRegistered >= maxAllowed && (
            <p className="text-sm text-amber-600">
              ⚠️ Đã đạt giới hạn {maxAllowed} ảnh. Xóa ảnh cũ để thêm mới.
            </p>
          )}
        </div>
      )}

      {/* Mode: Webcam */}
      {mode === 'webcam' && (() => {
        const stepIdx = totalRegistered < 3 ? totalRegistered : null;
        const step = stepIdx !== null ? REQUIRED_STEPS[stepIdx] : null;
        const colorMap: Record<string, string> = {
          blue: 'border-blue-200 bg-blue-50 text-blue-800',
          purple: 'border-purple-200 bg-purple-50 text-purple-800',
          indigo: 'border-indigo-200 bg-indigo-50 text-indigo-800',
        };
        const iconMap: Record<string, string> = {
          blue: 'text-blue-600',
          purple: 'text-purple-600',
          indigo: 'text-indigo-600',
        };
        return (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-gray-700">
                Chụp ảnh khuôn mặt ({totalRegistered + 1}/3)
              </h4>
              <button
                onClick={() => setMode('list')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Quay lại
              </button>
            </div>

            {/* Step guide banner */}
            {step && (
              <div className={`mb-4 flex items-center gap-3 rounded-xl border-2 p-4 ${colorMap[step.color]
                }`}>
                <div className={`shrink-0 ${iconMap[step.color]}`}>{step.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{step.label}</p>
                  <p className="text-sm opacity-80">{step.hint}</p>
                </div>
                {/* dot progress */}
                <div className="ml-auto flex gap-1.5">
                  {REQUIRED_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full ${i < totalRegistered
                        ? 'bg-green-500'
                        : i === totalRegistered
                          ? `bg-${step.color}-500`
                          : 'bg-gray-300'
                        }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Success message for completed step */}
            {message?.type === 'success' && stepIdx !== null && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-green-700 text-sm">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {message.text}
                {totalRegistered < 2 && (
                  <span className="ml-1 font-medium">→ Tiếp tục góc tiếp theo!</span>
                )}
              </div>
            )}

            {/* Error message */}
            {message?.type === 'error' && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {message.text}
              </div>
            )}

            <WebcamCapture
              key={totalRegistered}
              onCapture={handleCapture}
              isProcessing={registering}
              buttonText={step ? `Chụp ${step.label}` : 'Chụp & Đăng ký'}
              width={480}
              height={360}
            />
          </div>
        );
      })()}
    </div>
  );
}
