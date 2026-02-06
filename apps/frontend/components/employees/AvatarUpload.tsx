'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Camera, Eye } from 'lucide-react';
import AvatarUploadModal from './AvatarUploadModal';

interface AvatarUploadProps {
  currentAvatar?: string;
  employeeName: string;
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function AvatarUpload({ currentAvatar, employeeName, onUpload, disabled = false }: AvatarUploadProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const avatarUrl = currentAvatar 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}${currentAvatar}` 
    : null;

  const initials = employeeName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleUploadSuccess = async (file: File) => {
    await onUpload(file);
    setShowUploadModal(false);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Avatar Display */}
        <div className="relative group">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 transition-all">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={employeeName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{initials}</span>
              </div>
            )}

            {/* Overlay on hover */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                  title="Thay đổi ảnh"
                >
                  <Camera size={20} className="text-brandBlue" />
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                    title="Xem ảnh"
                  >
                    <Eye size={20} className="text-brandBlue" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {disabled ? 'Ảnh đại diện' : 'Click vào ảnh để thay đổi'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, GIF • Tối đa 5MB
          </p>
        </div>
      </div>

      {/* Upload Modal */}
      <AvatarUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadSuccess}
        employeeName={employeeName}
      />

      {/* Preview Modal */}
      {showPreviewModal && avatarUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowPreviewModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={avatarUrl}
              alt={employeeName}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />
            <p className="text-white text-center mt-4 text-lg font-medium">{employeeName}</p>
          </div>
        </div>
      )}
    </>
  );
}
