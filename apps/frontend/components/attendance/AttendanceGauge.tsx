'use client';

import { Target, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface AttendanceGaugeProps {
  rate: number;
  previousRate?: number;
  loading?: boolean;
}

export default function AttendanceGauge({ rate, previousRate, loading = false }: AttendanceGaugeProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-100 rounded w-32 mb-4"></div>
          <div className="h-48 bg-slate-100 rounded-full mx-auto w-48"></div>
        </div>
      </div>
    );
  }

  const change = previousRate ? rate - previousRate : 0;
  const isImproving = change > 0;

  // Calculate color based on rate
  const getColor = (rate: number) => {
    if (rate >= 95) return { 
      bg: 'bg-emerald-500', 
      text: 'text-emerald-600', 
      light: 'bg-emerald-50',
      border: 'border-emerald-200',
      gradient: 'from-emerald-500 to-green-600'
    };
    if (rate >= 85) return { 
      bg: 'bg-blue-500', 
      text: 'text-blue-600', 
      light: 'bg-blue-50',
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-indigo-600'
    };
    if (rate >= 75) return { 
      bg: 'bg-orange-500', 
      text: 'text-orange-600', 
      light: 'bg-orange-50',
      border: 'border-orange-200',
      gradient: 'from-orange-500 to-amber-600'
    };
    return { 
      bg: 'bg-red-500', 
      text: 'text-red-600', 
      light: 'bg-red-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-rose-600'
    };
  };

  const color = getColor(rate);
  const circumference = 2 * Math.PI * 65; // radius = 65
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <div className={`p-2 ${color.light} rounded-lg`}>
              <Target size={20} className={color.text} />
            </div>
            Tỷ lệ chấm công
          </h3>
          <p className="text-sm text-slate-600 mt-1 ml-11">Hôm nay</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="p-6">
        <div className="relative flex items-center justify-center mb-4">
          <svg className="transform -rotate-90" width="180" height="180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="65"
              stroke="#e2e8f0"
              strokeWidth="14"
              fill="none"
            />
            {/* Progress circle with gradient */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={color.text} />
                <stop offset="100%" className={color.text} />
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="90"
              r="65"
              stroke="currentColor"
              strokeWidth="14"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={color.text}
              style={{ 
                transition: 'stroke-dashoffset 1s ease-in-out',
                filter: 'drop-shadow(0 0 8px currentColor)'
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`p-2.5 ${color.light} rounded-full mb-2`}>
              <Zap size={20} className={color.text} />
            </div>
            <p className={`text-3xl font-bold ${color.text}`}>{rate}%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">Có mặt</p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2.5">
          {/* Change indicator */}
          {previousRate !== undefined && (
            <div className={`flex items-center justify-center gap-2 p-2.5 rounded-lg ${color.light} border ${color.border}`}>
              {isImproving ? (
                <>
                  <TrendingUp size={16} className={color.text} />
                  <span className={`text-sm font-bold ${color.text}`}>
                    +{change.toFixed(1)}% so với hôm qua
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown size={16} className={color.text} />
                  <span className={`text-sm font-bold ${color.text}`}>
                    {change.toFixed(1)}% so với hôm qua
                  </span>
                </>
              )}
            </div>
          )}

          {/* Status message */}
          <div className={`text-center p-3 rounded-lg ${color.light} border ${color.border}`}>
            {rate >= 95 && (
              <div>
                <p className={`text-base font-bold ${color.text} mb-0.5`}>Xuất sắc!</p>
                <p className="text-xs text-slate-600">Tỷ lệ chấm công rất tốt</p>
              </div>
            )}
            {rate >= 85 && rate < 95 && (
              <div>
                <p className={`text-base font-bold ${color.text} mb-0.5`}>Tốt!</p>
                <p className="text-xs text-slate-600">Duy trì phong độ này</p>
              </div>
            )}
            {rate >= 75 && rate < 85 && (
              <div>
                <p className={`text-base font-bold ${color.text} mb-0.5`}>Cần cải thiện</p>
                <p className="text-xs text-slate-600">Hãy nỗ lực hơn nữa</p>
              </div>
            )}
            {rate < 75 && (
              <div>
                <p className={`text-base font-bold ${color.text} mb-0.5`}>Cần chú ý!</p>
                <p className="text-xs text-slate-600">Tỷ lệ thấp hơn mức chuẩn</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
