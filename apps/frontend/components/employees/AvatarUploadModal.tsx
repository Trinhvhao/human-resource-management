'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Upload, RotateCw, ZoomIn, ZoomOut, Check } from 'lucide-react';

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
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
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
      
      // Crop image
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels, rotation);
      
      // Convert blob to file
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      // Upload
      await onUpload(croppedFile);
      
      // Close modal on success
      handleClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload thất bại. Vui lòng thử lại.');
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-primary">Cập nhật ảnh đại diện</h2>
            <p className="text-sm text-slate-500 mt-1">{employeeName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedImage ? (
            /* Upload Area */
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-brandBlue hover:bg-blue-50/50 transition-all">
                <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  Chọn ảnh để tải lên
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  JPG, PNG, GIF • Tối đa 5MB
                </p>
                <label className="inline-block px-6 py-3 bg-gradient-to-r from-brandBlue to-blue-700 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer">
                  <span>Chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            /* Crop Area */
            <div className="space-y-4">
              {/* Cropper */}
              <div className="relative h-96 bg-slate-900 rounded-xl overflow-hidden">
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
              <div className="space-y-4 bg-slate-50 rounded-xl p-4">
                {/* Zoom */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <ZoomIn size={16} />
                      Thu phóng
                    </label>
                    <span className="text-sm text-slate-600">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brandBlue"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <RotateCw size={16} />
                      Xoay
                    </label>
                    <span className="text-sm text-slate-600">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brandBlue"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedImage(null)}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Chọn ảnh khác
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-brandBlue to-blue-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải lên...</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Xác nhận</span>
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
