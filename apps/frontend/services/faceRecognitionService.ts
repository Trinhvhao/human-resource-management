import axiosInstance from '@/lib/axios';

export interface FaceDescriptorInfo {
  id: string;
  imageUrl: string | null;
  quality: number;
  createdAt: string;
}

export interface FaceRegistrationStatus {
  isRegistered: boolean;
  totalRegistered: number;
  maxAllowed: number;
  canRegisterMore: boolean;
}

export interface FaceRecognitionResult {
  employee: {
    id: string;
    fullName: string;
    employeeCode: string;
    avatarUrl: string | null;
  };
  attendance: any;
  recognition: {
    confidence: number;
    distance: number;
    quality: number;
    threshold: number;
  };
}

class FaceRecognitionService {
  /**
   * Đăng ký khuôn mặt (1 ảnh, gọi nhiều lần cho 3-5 ảnh)
   */
  async registerFace(image: string, employeeId?: string) {
    return axiosInstance.post('/face-recognition/register', {
      image,
      employeeId,
    });
  }

  /**
   * Chấm công vào bằng nhận diện khuôn mặt
   */
  async faceCheckIn(image: string) {
    return axiosInstance.post('/face-recognition/check-in', { image });
  }

  /**
   * Chấm công ra bằng nhận diện khuôn mặt
   */
  async faceCheckOut(image: string) {
    return axiosInstance.post('/face-recognition/check-out', { image });
  }

  /**
   * Kiểm tra trạng thái đăng ký khuôn mặt
   */
  async getRegistrationStatus() {
    return axiosInstance.get('/face-recognition/status');
  }

  /**
   * Lấy danh sách ảnh khuôn mặt đã đăng ký của bản thân
   */
  async getMyDescriptors() {
    return axiosInstance.get('/face-recognition/descriptors/me');
  }

  /**
   * Lấy danh sách ảnh khuôn mặt của 1 nhân viên (admin)
   */
  async getEmployeeDescriptors(employeeId: string) {
    return axiosInstance.get(`/face-recognition/descriptors/${employeeId}`);
  }

  /**
   * Xóa ảnh khuôn mặt
   */
  async deleteDescriptor(id: string) {
    return axiosInstance.delete(`/face-recognition/descriptors/${id}`);
  }

  /**
   * Test nhận diện (debug)
   */
  async testRecognition(image: string) {
    return axiosInstance.post('/face-recognition/test', { image });
  }
}

const faceRecognitionService = new FaceRecognitionService();
export default faceRecognitionService;
