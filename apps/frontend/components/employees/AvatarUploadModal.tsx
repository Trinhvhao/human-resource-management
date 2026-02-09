'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Upload, RotateCw, ZoomIn, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  employeeName: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AvatarUploadModal({ isOpen, onClose, onUpload, employeeName }: AvatarUploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setOriginalFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleUpload = async () => {
    if (!selectedImage || !croppedAreaPixels || !originalFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Step 1: Crop image (0-40%)
      setUploadProgress(10);
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels, rotation);
      setUploadProgress(40);

      // Step 2: Create file (40-50%)
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      setUploadProgress(50);

      // Step 3: Upload to server (50-90%)
      console.log('📤 Uploading avatar to server...');
      await onUpload(croppedFile);
      setUploadProgress(90);

      // Step 4: Complete (90-100%)
      console.log('✅ Avatar upload completed');
      setUploadProgress(100);

      // Wait a bit to show 100% before closing
      await new Promise(resolve => setTimeout(resolve, 500));
      handleClose();
    } catch (error) {
      console.error('❌ Upload failed:', error);
      setUploadProgress(0);
      // Don't show alert here, parent will show toast
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setOriginalFile(null);
    setUploadProgress(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-brandBlue to-blue-700 p-5">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ImageIcon size={20} />
                </div>
                Cập nhật ảnh đại diện
              </h2>
              <p className="text-blue-100 mt-1 text-sm truncate">{employeeName}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={uploading}
              className="p-2 hover:bg-white/20 rounded-lg transition-all disabled:opacity-50 backdrop-blur-sm flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-white text-xs mb-1.5">
                <span>Đang tải lên...</span>
                <span className="font-semibold">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300 ease-out shadow-lg"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!selectedImage ? (
            /* Upload Area */
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-brandBlue hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-brandBlue to-purple-500 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <Upload className="relative mx-auto text-slate-400 group-hover:text-brandBlue transition-colors duration-300" size={48} />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2 mt-4">
                  Chọn ảnh để tải lên
                </p>
                <p className="text-sm text-slate-500 mb-5">
                  Kéo thả file vào đây hoặc click để chọn
                </p>
                <div className="flex flex-col items-center gap-2">
                  <label className="inline-block px-6 py-3 bg-gradient-to-r from-brandBlue to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer font-medium">
                    <span className="flex items-center gap-2">
                      <Upload size={18} />
                      Chọn ảnh từ máy tính
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-400">
                    JPG, PNG, GIF • Tối đa 5MB
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-brandBlue rounded-full"></div>
                  Gợi ý chọn ảnh đẹp
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-brandBlue mt-0.5">•</span>
                    <span>Chọn ảnh chân dung, khuôn mặt rõ ràng</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brandBlue mt-0.5">•</span>
                    <span>Nền đơn giản, ánh sáng tốt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brandBlue mt-0.5">•</span>
                    <span>Độ phân giải tối thiểu 400x400 pixels</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* Crop Area */
            <div className="space-y-4">
              {/* Cropper */}
              <div className="relative h-80 bg-slate-900 rounded-xl overflow-hidden shadow-inner">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="space-y-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
                {/* Zoom */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <div className="p-1 bg-brandBlue/10 rounded">
                        <ZoomIn size={14} className="text-brandBlue" />
                      </div>
                      Thu phóng
                    </label>
                    <span className="text-xs font-semibold text-brandBlue bg-blue-100 px-2 py-0.5 rounded-lg">
                      {Math.round(zoom * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brandBlue hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${((zoom - 1) / 2) * 100}%, rgb(226, 232, 240) ${((zoom - 1) / 2) * 100}%, rgb(226, 232, 240) 100%)`
                    }}
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <div className="p-1 bg-brandBlue/10 rounded">
                        <RotateCw size={14} className="text-brandBlue" />
                      </div>
                      Xoay ảnh
                    </label>
                    <span className="text-xs font-semibold text-brandBlue bg-blue-100 px-2 py-0.5 rounded-lg">
                      {rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brandBlue hover:accent-blue-700 transition-colors"
                    style={{
                      background: `linear-gradient(to right, rgb(37, 99, 235) 0%, rgb(37, 99, 235) ${(rotation / 360) * 100}%, rgb(226, 232, 240) ${(rotation / 360) * 100}%, rgb(226, 232, 240) 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 font-medium text-sm"
                >
                  Chọn ảnh khác
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brandBlue to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 font-medium text-sm"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Xác nhận & Tải lên</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
