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
        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => router.push('/dashboard/departments/tree')}
            className="flex items-center gap-2 px-5 py-3 border-2 border-brandBlue text-brandBlue rounded-xl hover:bg-brandBlue hover:text-white transition-all font-semibold"
          >
            <Building2 size={20} />
            Sơ đồ tổ chức
          </button>
          <button
            onClick={() => router.push('/dashboard/departments/new')}
            className="flex items-center gap-2 px-5 py-3 bg-brandBlue text-white rounded-xl hover:bg-blue-700 hover:shadow-xl transition-all font-semibold shadow-lg shadow-brandBlue/20"
          >
            <Plus size={20} />
            Thêm phòng ban
          </button>
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
                className="bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-brandBlue/30 hover:shadow-xl transition-all group"
              >
                {/* Department Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center shadow-lg">
                      <Building2 className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-brandBlue group-hover:text-blue-700 transition-colors">{dept.name}</h3>
                      <p className="text-sm text-slate-600 font-medium">{dept.code}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {dept.description && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {dept.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b-2 border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users size={16} className="text-brandBlue" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">
                      {dept._count?.employees || 0} NV
                    </span>
                  </div>
                  {dept._count?.children ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Building2 size={16} className="text-secondary" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {dept._count.children} PB
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Manager */}
                {dept.manager && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-semibold mb-2">TRƯỞNG PHÒNG</p>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brandBlue to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {dept.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{dept.manager.fullName}</p>
                        <p className="text-xs text-slate-500">{dept.manager.position}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Parent Department */}
                {dept.parent && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 font-semibold mb-1">THUỘC PHÒNG</p>
                    <div className="flex items-center gap-1 text-sm text-brandBlue font-medium">
                      <ChevronRight size={14} />
                      <span>{dept.parent.name}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t-2 border-slate-100">
                  <button
                    onClick={() => router.push(`/dashboard/departments/${dept.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 text-brandBlue rounded-xl hover:bg-blue-100 transition-all text-sm font-semibold"
                  >
                    <Eye size={16} />
                    Xem
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/departments/${dept.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 transition-all text-sm font-semibold"
                  >
                    <Edit size={16} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
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
