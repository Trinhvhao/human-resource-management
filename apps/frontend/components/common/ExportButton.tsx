'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => Promise<void>;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function ExportButton({ 
  onExport, 
  label = 'Xuất', 
  className = '',
  disabled = false 
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await onExport();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className={`
        flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all
        ${success 
          ? 'bg-green-500 text-white border-2 border-green-600' 
          : 'border-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:text-green-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {exporting ? (
        <>
          <Loader2 className="animate-spin" size={18} />
          <span className="hidden sm:inline">Đang xuất...</span>
        </>
      ) : success ? (
        <>
          <CheckCircle size={18} />
          <span className="hidden sm:inline">Hoàn tất!</span>
        </>
      ) : (
        <>
          <Download size={18} />
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </button>
  );
}
