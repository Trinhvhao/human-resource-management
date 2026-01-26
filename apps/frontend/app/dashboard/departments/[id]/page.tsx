'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Edit, Trash2, Building2, Users, User, Mail, Phone, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import departmentService from '@/services/departmentService';
import { Department } from '@/types/department';

export default function DepartmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartment();
  }, [params.id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getById(params.id);
      setDepartment(response.data);
    } catch (error) {
      console.error('Failed to fetch department:', error);
      alert('Không tìm thấy phòng ban');
      router.push('/dashboard/departments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng ban này?')) return;

    try {
      await departmentService.delete(params.id);
      router.push('/dashboard/departments');
    } catch (error: any) {
      console.error('Failed to delete department:', error);
      alert(error.response?.data?.message || 'Xóa phòng ban thất bại');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="bg-white rounded-2xl p-8 space-y-6">
            <div className="h-32 bg-slate-100 rounded-2xl"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!department) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Chi tiết phòng ban</h1>
              <p className="text-slate-500 mt-1">{department.code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/dashboard/departments/${params.id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brandBlue to-[#0047b3] text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Edit size={18} />
              Chỉnh sửa
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              <Trash2 size={18} />
              Xóa
            </button>
          </div>
        </div>

        {/* Department Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-slate-200"
        >
          <div className="flex items-start gap-6">
            {/* Icon */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brandBlue to-brandLightBlue flex items-center justify-center">
              <Building2 className="text-white" size={48} />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary">{department.name}</h2>
                  <p className="text-lg text-brandBlue font-medium mt-1">{department.code}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  department.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {department.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>

              {department.description && (
                <p className="text-slate-600 mt-4">{department.description}</p>
              )}

              {/* Parent Department */}
              {department.parent && (
                <div className="mt-4 flex items-center gap-2 text-slate-600">
                  <ChevronRight size={16} />
                  <span className="text-sm">Thuộc phòng:</span>
                  <span className="text-brandBlue font-medium">{department.parent.name}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số nhân viên</p>
                <p className="text-2xl font-bold text-primary">{department._count?.employees || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Building2 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Phòng ban con</p>
                <p className="text-2xl font-bold text-primary">{department._count?.children || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 border border-slate-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Briefcase className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Trạng thái</p>
                <p className="text-lg font-bold text-primary">
                  {department.isActive ? 'Hoạt động' : 'Ngừng'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Manager Info */}
        {department.manager && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Briefcase className="text-secondary" size={24} />
              </div>
              <h3 className="text-lg font-bold text-primary">Trưởng phòng</h3>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-brandRed flex items-center justify-center text-white text-2xl font-bold">
                {department.manager.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-primary">{department.manager.fullName}</h4>
                <p className="text-brandBlue font-medium mt-1">{department.manager.position}</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-600">{department.manager.employeeCode}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-departments */}
        {department.children && department.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-brandBlue/10 flex items-center justify-center">
                <Building2 className="text-brandBlue" size={24} />
              </div>
              <h3 className="text-lg font-bold text-primary">Phòng ban trực thuộc</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {department.children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => router.push(`/dashboard/departments/${child.id}`)}
                  className="p-4 border border-slate-200 rounded-xl hover:border-brandBlue hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brandBlue/10 flex items-center justify-center">
                      <Building2 className="text-brandBlue" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{child.name}</p>
                      <p className="text-sm text-slate-500">{child.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Employees List */}
        {department.employees && department.employees.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-primary">Nhân viên ({department._count?.employees || 0})</h3>
              </div>
              {(department._count?.employees || 0) > 10 && (
                <button
                  onClick={() => router.push(`/dashboard/employees?departmentId=${params.id}`)}
                  className="text-sm text-brandBlue hover:underline"
                >
                  Xem tất cả
                </button>
              )}
            </div>

            <div className="space-y-3">
              {department.employees.slice(0, 10).map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => router.push(`/dashboard/employees/${employee.id}`)}
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:border-brandBlue hover:bg-blue-50 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-brandBlue/10 flex items-center justify-center text-brandBlue font-semibold">
                    {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{employee.fullName}</p>
                    <p className="text-sm text-slate-500">{employee.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600">{employee.employeeCode}</p>
                    <p className="text-xs text-slate-400">{employee.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
