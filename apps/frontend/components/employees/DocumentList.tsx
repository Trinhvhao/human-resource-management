'use client';

import React, { useState } from 'react';
import { EmployeeDocument, DOCUMENT_TYPE_LABELS } from '@/types/employee-profile';
import { formatDate } from '@/utils/formatDate';

interface DocumentListProps {
  documents: EmployeeDocument[];
  onDelete: (documentId: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function DocumentList({ documents, onDelete, onRefresh }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (doc: EmployeeDocument) => {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu "${doc.fileName}"?`)) {
      return;
    }

    try {
      setDeletingId(doc.id);
      await onDelete(doc.id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Xóa thất bại. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 font-medium">Chưa có tài liệu nào</p>
        <p className="text-sm text-gray-500 mt-1">Tải lên tài liệu đầu tiên</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            {/* File Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(doc.mimeType)}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {doc.fileName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {DOCUMENT_TYPE_LABELS[doc.documentType as keyof typeof DOCUMENT_TYPE_LABELS]}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Tải xuống"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Xóa"
                  >
                    {deletingId === doc.id ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                  {doc.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>{formatDate(doc.uploadedAt)}</span>
              </div>

              {/* Uploader */}
              {doc.uploader && (
                <p className="text-xs text-gray-500 mt-1">
                  Tải lên bởi: {doc.uploader.email}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
