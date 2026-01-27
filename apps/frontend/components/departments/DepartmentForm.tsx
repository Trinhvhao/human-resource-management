'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import departmentService from '@/services/departmentService';
import employeeService from '@/services/employeeService';
import { Department } from '@/types/department';
import { Employee } from '@/types/employee';

const departmentSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban là bắt buộc').max(50, 'Mã phòng ban tối đa 50 ký tự'),
  name: z.string().min(1, 'Tên phòng ban là bắt buộc').max(255, 'Tên phòng ban tối đa 255 ký tự'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  mode: 'create' | 'edit';
  departmentId?: string;
}

export default function DepartmentForm({ mode, departmentId }: DepartmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(mode === 'edit');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    if (mode === 'edit' && departmentId) {
      fetchDepartment();
    }
  }, [mode, departmentId]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      // Filter out current department if editing
      const filtered = mode === 'edit' 
        ? response.data.filter(d => d.id !== departmentId)
        : response.data;
      setDepartments(filtered);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ status: 'ACTIVE', limit: 1000 });
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchDepartment = async () => {
    if (!departmentId) return;

    try {
      setLoadingData(true);
      const response = await departmentService.getById(departmentId);
      const dept = response.data;
      reset({
        code: dept.code,
        name: dept.name,
        description: dept.description || '',
        parentId: dept.parentId || '',
        managerId: dept.managerId || '',
      });
    } catch (error) {
      console.error('Failed to fetch department:', error);
      alert('Không tìm thấy phòng ban');
      router.push('/dashboard/departments');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);

      // Clean up empty strings
      const cleanData = {
        ...data,
        parentId: data.parentId || undefined,
        managerId: data.managerId || undefined,
        description: data.description || undefined,
      };

      if (mode === 'create') {
        await departmentService.create(cleanData);
        alert('Tạo phòng ban thành công');
      } else if (departmentId) {
        await departmentService.update(departmentId, cleanData);
        alert('Cập nhật phòng ban thành công');
      }

      router.push('/dashboard/departments');
    } catch (error: any) {
      console.error('Failed to save department:', error);
      alert(error.response?.data?.message || 'Lưu phòng ban thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="bg-white rounded-2xl p-8 space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary">
              {mode === 'create' ? 'Thêm phòng ban mới' : 'Chỉnh sửa phòng ban'}
            </h1>
            <p className="text-slate-500 mt-1">
              {mode === 'create' ? 'Tạo phòng ban mới trong hệ thống' : 'Cập nhật thông tin phòng ban'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 border border-slate-200">
          <div className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mã phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('code')}
                placeholder="VD: IT, HR, SALES"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tên phòng ban <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="VD: Phòng Công Nghệ Thông Tin"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mô tả
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Mô tả về phòng ban, chức năng, nhiệm vụ..."
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Parent Department */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phòng ban cấp trên
              </label>
              <select
                {...register('parentId')}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
              >
                <option value="">-- Không có (phòng ban cấp cao nhất) --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.parentId && (
                <p className="text-red-500 text-sm mt-1">{errors.parentId.message}</p>
              )}
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trưởng phòng
              </label>
              <select
                {...register('managerId')}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue"
              >
                <option value="">-- Chưa chọn trưởng phòng --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} - {emp.position} ({emp.employeeCode})
                  </option>
                ))}
              </select>
              {errors.managerId && (
                <p className="text-red-500 text-sm mt-1">{errors.managerId.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-brandBlue text-white rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>{mode === 'create' ? 'Tạo phòng ban' : 'Cập nhật'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
