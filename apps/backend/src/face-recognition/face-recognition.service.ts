import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AttendancesService } from '../attendances/attendances.service';
// Use WASM variant - no native compilation needed (works on all platforms)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
import { createCanvas, loadImage, GlobalFonts, Image as NImage } from '@napi-rs/canvas';
import * as path from 'path';

// Monkey-patch face-api.js to use @napi-rs/canvas
// @napi-rs/canvas has a compatible API
faceapi.env.monkeyPatch({
  Canvas: (createCanvas as any).constructor || Object,
  Image: NImage || Object,
});

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private modelsLoaded = false;
  private tf: any = null;
  private readonly threshold: number;
  private readonly maxDescriptorsPerEmployee: number;
  private readonly minQuality: number;

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private attendancesService: AttendancesService,
    private configService: ConfigService,
  ) {
    this.threshold = parseFloat(
      this.configService.get<string>('FACE_RECOGNITION_THRESHOLD', '0.6'),
    );
    this.maxDescriptorsPerEmployee = parseInt(
      this.configService.get<string>('FACE_RECOGNITION_MAX_DESCRIPTORS', '5'),
      10,
    );
    this.minQuality = parseFloat(
      this.configService.get<string>('FACE_RECOGNITION_MIN_QUALITY', '0.5'),
    );
  }

  async onModuleInit() {
    await this.loadModels();
  }

  /**
   * Load face-api.js pre-trained models (SSD MobileNetV1 + landmarks + recognition)
   */
  private async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;

    try {
      // Initialize TF.js WASM backend before loading models
      this.tf = require('@tensorflow/tfjs');
      require('@tensorflow/tfjs-backend-wasm');
      await this.tf.setBackend('wasm');
      await this.tf.ready();
      this.logger.log(`TensorFlow.js backend: ${this.tf.getBackend()}`);

      const modelsPath = path.join(
        process.cwd(),
        'node_modules',
        '@vladmandic',
        'face-api',
        'model',
      );

      this.logger.log(`Loading face-api models from: ${modelsPath}`);

      await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);

      this.modelsLoaded = true;
      this.logger.log('Face-API models loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load face-api models:', error);
      throw error;
    }
  }

  /**
   * Extract face descriptor (128-dim vector) from a base64 image
   */
  private async extractDescriptor(
    base64Image: string,
  ): Promise<{ descriptor: Float32Array; quality: number }> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    // Strip data URI prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Load image using @napi-rs/canvas
    const img = await loadImage(buffer);
    const cvs = createCanvas(img.width, img.height);
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // face-api WASM build does not accept @napi-rs/canvas Canvas directly.
    // Convert pixel data to tf.Tensor3D (shape [H, W, 3] int32) which face-api accepts.
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const { width, height } = img;
    const rgbData = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      rgbData[i * 3] = imageData.data[i * 4];     // R
      rgbData[i * 3 + 1] = imageData.data[i * 4 + 1]; // G
      rgbData[i * 3 + 2] = imageData.data[i * 4 + 2]; // B
    }
    const tensor = this.tf.tensor3d(rgbData, [height, width, 3], 'int32');

    // Detect face with landmarks and compute descriptor
    let detection: any;
    try {
      detection = await faceapi
        .detectSingleFace(tensor)
        .withFaceLandmarks()
        .withFaceDescriptor();
    } finally {
      tensor.dispose();
    }

    if (!detection) {
      throw new BadRequestException(
        'Không phát hiện khuôn mặt trong ảnh. Vui lòng chụp lại với ánh sáng tốt và nhìn thẳng vào camera.',
      );
    }

    const quality = detection.detection.score;

    if (quality < this.minQuality) {
      throw new BadRequestException(
        `Chất lượng ảnh quá thấp (${(quality * 100).toFixed(1)}%). Cần tối thiểu ${(this.minQuality * 100).toFixed(0)}%. Vui lòng chụp lại.`,
      );
    }

    return {
      descriptor: detection.descriptor,
      quality,
    };
  }

  /**
   * Calculate Euclidean distance between two descriptors
   */
  private euclideanDistance(a: Float32Array | number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  // ==================== PUBLIC API ====================

  /**
   * Register a face descriptor for an employee
   */
  async registerFace(
    image: string,
    currentUser: { employeeId: string; role: string },
    targetEmployeeId?: string,
  ) {
    // Determine which employee to register for
    const employeeId = targetEmployeeId || currentUser.employeeId;

    // Only admin/HR can register for other employees
    if (
      targetEmployeeId &&
      targetEmployeeId !== currentUser.employeeId &&
      !['ADMIN', 'HR_MANAGER'].includes(currentUser.role)
    ) {
      throw new BadRequestException(
        'Bạn không có quyền đăng ký khuôn mặt cho nhân viên khác.',
      );
    }

    // Check employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, fullName: true, employeeCode: true },
    });

    if (!employee) {
      throw new NotFoundException('Không tìm thấy nhân viên.');
    }

    // Check max descriptors limit
    const existingCount = await this.prisma.faceDescriptor.count({
      where: { employeeId },
    });

    if (existingCount >= this.maxDescriptorsPerEmployee) {
      throw new BadRequestException(
        `Đã đạt giới hạn tối đa ${this.maxDescriptorsPerEmployee} ảnh. Vui lòng xóa ảnh cũ trước khi đăng ký thêm.`,
      );
    }

    // Extract face descriptor
    const { descriptor, quality } = await this.extractDescriptor(image);

    // Check for duplicate (too similar to existing descriptor)
    const existingDescriptors = await this.prisma.faceDescriptor.findMany({
      where: { employeeId },
      select: { descriptor: true },
    });

    for (const existing of existingDescriptors) {
      const distance = this.euclideanDistance(descriptor, existing.descriptor);
      if (distance < 0.3) {
        throw new BadRequestException(
          'Ảnh quá giống với ảnh đã đăng ký. Vui lòng chụp ảnh với góc khác.',
        );
      }
    }

    // Save to storage (optional, for display)
    let imageUrl: string | null = null;
    try {
      const fileBuffer = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );
      const folder = `face-descriptors/${employeeId}`;
      const fileName = `${Date.now()}.jpg`;
      imageUrl = await this.storageService.uploadFile(fileBuffer, fileName, folder);
    } catch (err) {
      this.logger.warn('Failed to upload face image to storage:', err);
    }

    // Save descriptor to DB
    const saved = await this.prisma.faceDescriptor.create({
      data: {
        employeeId,
        descriptor: Array.from(descriptor),
        quality,
        imageUrl,
      },
    });

    return {
      success: true,
      message: `Đăng ký khuôn mặt thành công (${existingCount + 1}/${this.maxDescriptorsPerEmployee})`,
      data: {
        id: saved.id,
        quality,
        imageUrl,
        totalRegistered: existingCount + 1,
        maxAllowed: this.maxDescriptorsPerEmployee,
        employee: {
          id: employee.id,
          fullName: employee.fullName,
          employeeCode: employee.employeeCode,
        },
      },
    };
  }

  /**
   * Face check-in: match face against all registered descriptors
   */
  async faceCheckIn(image: string, currentEmployeeId?: string) {
    const { descriptor, quality } = await this.extractDescriptor(image);
    const match = await this.findBestMatch(descriptor, currentEmployeeId);

    if (!match) {
      // Log for debugging
      this.logger.warn(`Face check-in failed: No match found. Quality: ${quality.toFixed(2)}, Threshold: ${this.threshold}`);
      throw new BadRequestException(
        `Không tìm thấy khuôn mặt khớp (độ tin cậy < ${Math.round((1 - this.threshold) * 100)}%). ` +
        `Vui lòng đảm bảo bạn đã đăng ký khuôn mặt và nhìn thẳng vào camera.`
      );
    }

    // Call the attendances service to do the actual check-in
    const attendance = await this.attendancesService.checkIn(match.employeeId);

    return {
      success: true,
      message: `Chấm công vào thành công - ${match.employee.fullName}`,
      data: {
        employee: match.employee,
        attendance: attendance.data,
        recognition: {
          confidence: Math.round((1 - match.distance) * 100),
          distance: match.distance,
          quality: Math.round(quality * 100),
          threshold: this.threshold,
        },
      },
    };
  }

  /**
   * Face check-out: match face against all registered descriptors
   */
  async faceCheckOut(image: string, currentEmployeeId?: string) {
    const { descriptor, quality } = await this.extractDescriptor(image);
    const match = await this.findBestMatch(descriptor, currentEmployeeId);

    if (!match) {
      throw new BadRequestException('Không nhận diện được khuôn mặt. Vui lòng nhìn thẳng vào camera và thử lại.');
    }

    const attendance = await this.attendancesService.checkOut(match.employeeId);

    return {
      success: true,
      message: `Chấm công ra thành công - ${match.employee.fullName}`,
      data: {
        employee: match.employee,
        attendance: attendance.data,
        recognition: {
          confidence: Math.round((1 - match.distance) * 100),
          distance: match.distance,
          quality: Math.round(quality * 100),
          threshold: this.threshold,
        },
      },
    };
  }

  /**
   * Find the best matching employee for a given face descriptor
   */
  private async findBestMatch(
    descriptor: Float32Array,
    employeeId?: string,
  ): Promise<{
    employeeId: string;
    employee: { id: string; fullName: string; employeeCode: string; avatarUrl: string | null };
    distance: number;
  } | null> {
    const allDescriptors = await this.prisma.faceDescriptor.findMany({
      where: employeeId ? { employeeId } : undefined,
      select: {
        descriptor: true,
        employeeId: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (allDescriptors.length === 0) {
      return null;
    }

    let bestMatch: {
      employeeId: string;
      employee: { id: string; fullName: string; employeeCode: string; avatarUrl: string | null };
      distance: number;
    } | null = null;

    let closestDistance = Infinity;

    for (const stored of allDescriptors) {
      const distance = this.euclideanDistance(descriptor, stored.descriptor);

      // Track closest match for logging
      if (distance < closestDistance) {
        closestDistance = distance;
      }

      if (distance < this.threshold) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            employeeId: stored.employeeId,
            employee: stored.employee,
            distance,
          };
        }
      }
    }

    // Log for debugging
    if (!bestMatch && closestDistance !== Infinity) {
      this.logger.warn(
        `No match found. Closest distance: ${closestDistance.toFixed(3)} (threshold: ${this.threshold}, ` +
        `confidence would be: ${Math.round((1 - closestDistance) * 100)}%)`
      );
    }

    return bestMatch;
  }

  /**
   * Get registration status for current user
   */
  async getRegistrationStatus(employeeId: string) {
    const count = await this.prisma.faceDescriptor.count({
      where: { employeeId },
    });

    return {
      success: true,
      data: {
        isRegistered: count > 0,
        totalRegistered: count,
        maxAllowed: this.maxDescriptorsPerEmployee,
        canRegisterMore: count < this.maxDescriptorsPerEmployee,
      },
    };
  }

  /**
   * Get all descriptors for an employee
   */
  async getEmployeeDescriptors(employeeId: string) {
    const descriptors = await this.prisma.faceDescriptor.findMany({
      where: { employeeId },
      select: {
        id: true,
        imageUrl: true,
        quality: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: descriptors,
    };
  }

  /**
   * Delete a face descriptor (own)
   */
  async deleteDescriptor(id: string, employeeId: string) {
    const descriptor = await this.prisma.faceDescriptor.findFirst({
      where: { id, employeeId },
    });

    if (!descriptor) {
      throw new NotFoundException('Không tìm thấy mẫu khuôn mặt.');
    }

    // Delete image from storage if exists
    if (descriptor.imageUrl) {
      try {
        await this.storageService.deleteFile(descriptor.imageUrl);
      } catch (err) {
        this.logger.warn('Failed to delete face image from storage:', err);
      }
    }

    await this.prisma.faceDescriptor.delete({ where: { id } });

    return {
      success: true,
      message: 'Đã xóa mẫu khuôn mặt.',
    };
  }

  /**
   * Delete a face descriptor (admin - any employee)
   */
  async deleteDescriptorAdmin(id: string) {
    const descriptor = await this.prisma.faceDescriptor.findUnique({
      where: { id },
    });

    if (!descriptor) {
      throw new NotFoundException('Không tìm thấy mẫu khuôn mặt.');
    }

    if (descriptor.imageUrl) {
      try {
        await this.storageService.deleteFile(descriptor.imageUrl);
      } catch (err) {
        this.logger.warn('Failed to delete face image from storage:', err);
      }
    }

    await this.prisma.faceDescriptor.delete({ where: { id } });

    return {
      success: true,
      message: 'Đã xóa mẫu khuôn mặt.',
    };
  }

  /**
   * Test face recognition (admin debug endpoint)
   */
  async testRecognition(image: string) {
    const { descriptor, quality } = await this.extractDescriptor(image);
    const match = await this.findBestMatch(descriptor);

    return {
      success: true,
      data: {
        faceDetected: true,
        quality,
        match: match
          ? {
            employee: match.employee,
            confidence: Math.round((1 - match.distance) * 100),
            distance: match.distance,
            threshold: this.threshold,
            isMatch: match.distance < this.threshold,
          }
          : null,
      },
    };
  }
}
