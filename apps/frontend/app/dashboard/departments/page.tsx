'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Building2, Users, Plus, Edit, Trash2, Eye, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import departmentService from '@/services/departmentService';
import { Department } from '@/types/department';

export default function DepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;

    try {
      await departmentService.delete(id);
      fetchDepartments();
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      alert(error.response?.data?.message || 'Xóa phòng ban thất bại');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Quản lý Phòng ban</h1>
            <p className="text-slate-500 mt-1">Tổng số: {departments.length} phòng ban</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/departments/tree')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Building2 size={20} />
              Sơ đồ tổ chức
            </button>
            <button
              onClick={() => router.push('/dashboard/departments/new')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brandBlue to-brandLightBlue text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Thêm phòng ban
            </button>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6 border border-slate-200">
                <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3"></div>
              </div>
            ))
          ) : departments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-400">Chưa có phòng ban nào</p>
            </div>
          ) : (
            departments.map((dept, index) => (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all"
              >
                {/* Department Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brandBlue to-brandLightBlue flex items-center justify-center">
                      <Building2 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary">{dept.name}</h3>
                      <p className="text-sm text-slate-500">{dept.code}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dept.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {dept.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-brandBlue" />
                    <span className="text-sm text-slate-600">
                      {dept._count?.employees || 0} nhân viên
                    </span>
                  </div>
                  {dept._count?.children ? (
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-secondary" />
                      <span className="text-sm text-slate-600">
                        {dept._count.children} phòng con
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Manager */}
                {dept.manager && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Trưởng phòng</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold text-xs">
                        {dept.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{dept.manager.fullName}</p>
                        <p className="text-xs text-slate-500">{dept.manager.position}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent Department */}
                {dept.parent && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1">Thuộc phòng</p>
                    <div className="flex items-center gap-1 text-sm text-brandBlue">
                      <ChevronRight size={14} />
                      <span>{dept.parent.name}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/departments/${dept.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    Xem
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/departments/${dept.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                  >
                    <Edit size={16} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
