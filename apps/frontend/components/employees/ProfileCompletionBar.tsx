'use client';

import React from 'react';

interface ProfileCompletionBarProps {
  percentage: number;
  showDetails?: boolean;
}

export default function ProfileCompletionBar({ percentage, showDetails = false }: ProfileCompletionBarProps) {
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sections = [
    { name: 'Thông tin cá nhân', value: 20 },
    { name: 'Liên hệ khẩn cấp', value: 20 },
    { name: 'Học vấn', value: 20 },
    { name: 'Ngân hàng', value: 20 },
    { name: 'Tài liệu', value: 20 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Hoàn thiện hồ sơ</span>
          <span className={`text-lg font-bold ${getTextColor()}`}>{percentage}%</span>
        </div>
        {percentage === 100 && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Hoàn tất
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Section Breakdown */}
      {showDetails && (
        <div className="grid grid-cols-5 gap-2 mt-4">
          {sections.map((section, index) => {
            const isComplete = percentage >= (index + 1) * 20;
            return (
              <div key={section.name} className="text-center">
                <div className={`w-full h-2 rounded-full mb-1 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                <p className="text-xs text-gray-600">{section.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
