'use client';

import { useState, useEffect } from 'react';
import { ScanFace, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { FaceRegistration } from '@/components/face-recognition';
import faceRecognitionService from '@/services/faceRecognitionService';

export default function FaceRecognitionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<{
    isRegistered: boolean;
    totalRegistered: number;
    maxAllowed: number;
  } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await faceRecognitionService.getRegistrationStatus();
      // Axios interceptor unwraps response.data → { success, data: { isRegistered, ... } }
      const data = (response as any)?.data ?? response;
      if (data && typeof data.isRegistered !== 'undefined') {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back navigation */}
      <button
        onClick={() => router.push('/dashboard/my-attendance')}
        className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại Chấm công
      </button>

      {/* Page header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-xl bg-linear-to-br from-blue-500 to-purple-600 p-3">
          <ScanFace className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhận diện khuôn mặt
          </h1>
          <p className="text-gray-500">
            Đăng ký khuôn mặt để chấm công tự động
          </p>
        </div>
      </div>

      {/* Status card */}
      {status && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-700">Trạng thái</h3>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    status.isRegistered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {status.isRegistered
                    ? `✅ Đã đăng ký (${status.totalRegistered} ảnh)`
                    : '⚠️ Chưa đăng ký'}
                </span>
              </div>
            </div>

            {status.isRegistered && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Bạn có thể</p>
                <button
                  onClick={() => router.push('/dashboard/my-attendance')}
                  className="mt-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Chấm công bằng khuôn mặt →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Face registration component */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <FaceRegistration onRegistrationComplete={loadStatus} />
      </div>

      {/* Info section */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">
          Hướng dẫn sử dụng
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-800">
              1. Đăng ký khuôn mặt
            </h4>
            <p className="text-sm text-gray-600">
              Upload 3-5 ảnh khuôn mặt rõ ràng với các góc chụp khác nhau. Hệ
              thống sẽ trích xuất đặc trưng khuôn mặt từ mỗi ảnh.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-800">
              2. Chấm công hàng ngày
            </h4>
            <p className="text-sm text-gray-600">
              Tại trang chấm công, chọn &quot;Chấm công bằng khuôn mặt&quot;, nhìn thẳng vào
              camera và nhấn chụp. Hệ thống sẽ tự động nhận diện và ghi nhận
              chấm công.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-800">
              3. Yêu cầu chất lượng ảnh
            </h4>
            <p className="text-sm text-gray-600">
              Ảnh cần đủ ánh sáng, nhìn thẳng camera, không đeo kính đen hay
              khẩu trang. Mỗi ảnh chỉ có 1 khuôn mặt.
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <h4 className="mb-2 font-medium text-gray-800">
              4. Bảo mật
            </h4>
            <p className="text-sm text-gray-600">
              Dữ liệu khuôn mặt được lưu trữ dưới dạng vector số học
              (128 chiều), không lưu ảnh gốc. Bạn có thể xóa dữ liệu bất kỳ
              lúc nào.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
