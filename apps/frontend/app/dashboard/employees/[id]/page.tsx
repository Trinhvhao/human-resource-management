'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, Building, Briefcase, DollarSign, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import employeeService from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { formatDate, formatCurrency } from '@/utils/formatters';
import SalaryStructure from '@/components/employees/SalaryStructure';

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployee();
    }, [params.id]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const response = await employeeService.getById(params.id);
            setEmployee(response.data);
        } catch (error) {
            console.error('Failed to fetch employee:', error);
            alert('Không tìm thấy nhân viên');
            router.push('/dashboard/employees');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;

        try {
            await employeeService.delete(params.id);
            router.push('/dashboard/employees');
        } catch (error) {
            console.error('Failed to delete employee:', error);
            alert('Xóa nhân viên thất bại');
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
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!employee) return null;

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
                            <h1 className="text-3xl font-bold text-primary">Chi tiết nhân viên</h1>
                            <p className="text-slate-500 mt-1">{employee.employeeCode}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/dashboard/employees/${params.id}/edit`)}
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

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-8 border border-slate-200"
                >
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        {employee.avatarUrl ? (
                            <img
                                src={employee.avatarUrl}
                                alt={employee.fullName}
                                className="w-32 h-32 rounded-2xl object-cover border-4 border-brandBlue/10"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-brandBlue to-brandLightBlue flex items-center justify-center text-white text-4xl font-bold">
                                {employee.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-primary">{employee.fullName}</h2>
                                    <p className="text-lg text-brandBlue font-medium mt-1">{employee.position}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {employee.status === 'ACTIVE' ? 'Đang làm việc' :
                                        employee.status === 'ON_LEAVE' ? 'Đang nghỉ' : 'Đã nghỉ việc'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Mail className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="text-sm font-medium text-primary">{employee.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                        <Phone className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Số điện thoại</p>
                                        <p className="text-sm font-medium text-primary">{employee.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Calendar className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Ngày sinh</p>
                                        <p className="text-sm font-medium text-primary">{formatDate(employee.dateOfBirth)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brandBlue/10 flex items-center justify-center">
                                        <Building className="text-brandBlue" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Phòng ban</p>
                                        <p className="text-sm font-medium text-primary">{employee.department?.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Work Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-brandBlue/10 flex items-center justify-center">
                                <Briefcase className="text-brandBlue" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-primary">Thông tin công việc</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Mã nhân viên</span>
                                <span className="font-semibold text-primary">{employee.employeeCode}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Chức vụ</span>
                                <span className="font-semibold text-primary">{employee.position}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Ngày vào làm</span>
                                <span className="font-semibold text-primary">{formatDate(employee.startDate)}</span>
                            </div>
                            {employee.endDate && (
                                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                    <span className="text-slate-600">Ngày nghỉ việc</span>
                                    <span className="font-semibold text-primary">{formatDate(employee.endDate)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-600">Trạng thái</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${employee.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                        employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {employee.status}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Personal Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                <FileText className="text-secondary" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-primary">Thông tin cá nhân</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Giới tính</span>
                                <span className="font-semibold text-primary">{employee.gender || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">CMND/CCCD</span>
                                <span className="font-semibold text-primary">{employee.idCard}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Địa chỉ</span>
                                <span className="font-semibold text-primary text-right">{employee.address || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                                <span className="text-slate-600">Lương cơ bản</span>
                                <span className="font-bold text-brandBlue">{formatCurrency(Number(employee.baseSalary))}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Quick Stats - From Database */}
                {employee._count && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <p className="text-sm text-slate-600">Số hợp đồng</p>
                            <p className="text-2xl font-bold mt-2 text-purple-600">{employee._count.contracts}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <p className="text-sm text-slate-600">Số ngày công</p>
                            <p className="text-2xl font-bold mt-2 text-green-600">{employee._count.attendances}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <p className="text-sm text-slate-600">Đơn nghỉ phép</p>
                            <p className="text-2xl font-bold mt-2 text-blue-600">{employee._count.leaveRequests}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                        >
                            <p className="text-sm text-slate-600">Khen thưởng/Kỷ luật</p>
                            <p className="text-2xl font-bold mt-2 text-yellow-600">
                                {employee._count.rewards + employee._count.disciplines}
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Salary Structure */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <SalaryStructure employeeId={params.id} canEdit={true} />
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
