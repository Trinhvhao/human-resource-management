'use client';

import React from 'react';
import EmployeeForm from '@/components/employees/EmployeeForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function NewEmployeePage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredPermission="CREATE_EMPLOYEE">
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-primary">Thêm nhân viên mới</h1>
                <p className="text-sm text-slate-500 mt-1">Điền thông tin nhân viên</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <EmployeeForm mode="create" />
        </div>
      </>
    </ProtectedRoute>
  );
}
