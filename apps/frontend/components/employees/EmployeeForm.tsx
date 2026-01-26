'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ArrowLeft, Save, X } from 'lucide-react';
import employeeService from '@/services/employeeService';
import departmentService from '@/services/departmentService';
import { Department } from '@/types/department';

const employeeSchema = z.object({
    employeeCode: z.string().min(1, 'Mã nhân viên là bắt buộc'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().optional(),
    dateOfBirth: z.string().min(1, 'Ngày sinh là bắt buộc'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    idCard: z.string().min(9, 'CMND/CCCD phải có ít nhất 9 số'),
    address: z.string().optional(),
    departmentId: z.string().min(1, 'Phòng ban là bắt buộc'),
    position: z.string().min(1, 'Chức vụ là bắt buộc'),
    startDate: z.string().min(1, 'Ngày vào làm là bắt buộc'),
    baseSalary: z.string().min(1, 'Lương cơ bản là bắt buộc'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
    employeeId?: string;
    mode: 'create' | 'edit';
}

export default function EmployeeForm({ employeeId, mode }: EmployeeFormProps) {
    const router = useRouter();
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(mode === 'edit');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            status: 'ACTIVE',
        },
    });

    useEffect(() => {
        fetchDepartments();
        if (mode === 'edit' && employeeId) {
            fetchEmployee();
        }
    }, [mode, employeeId]);

    const fetchDepartments = async () => {
        try {
            const response = await departmentService.getAll();
            setDepartments(response.data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchEmployee = async () => {
        if (!employeeId) return;

        try {
            setLoadingData(true);
            const response = await employeeService.getById(employeeId);
            const employee = response.data;

            reset({
                employeeCode: employee.employeeCode,
                fullName: employee.fullName,
                email: employee.email,
                phone: employee.phone || '',
                dateOfBirth: employee.dateOfBirth.split('T')[0],
                gender: employee.gender,
                idCard: employee.idCard,
                address: employee.address || '',
                departmentId: employee.departmentId,
                position: employee.position,
                startDate: employee.startDate.split('T')[0],
                baseSalary: employee.baseSalary.toString(),
                status: employee.status,
            });
        } catch (error) {
            console.error('Failed to fetch employee:', error);
            alert('Không thể tải thông tin nhân viên');
            router.back();
        } finally {
            setLoadingData(false);
        }
    };

    const onSubmit = async (data: EmployeeFormData) => {
        try {
            setLoading(true);

            const payload: any = {
                fullName: data.fullName,
                email: data.email,
                phone: data.phone || undefined,
                dateOfBirth: new Date(data.dateOfBirth).toISOString(),
                gender: data.gender || undefined,
                idCard: data.idCard,
                address: data.address || undefined,
                departmentId: data.departmentId,
                position: data.position,
                startDate: new Date(data.startDate).toISOString(),
                baseSalary: parseFloat(data.baseSalary),
            };

            if (mode === 'create') {
                await employeeService.create(payload);
                alert('Thêm nhân viên thành công!');
            } else if (employeeId) {
                payload.status = data.status;
                await employeeService.update(employeeId, payload);
                alert('Cập nhật nhân viên thành công!');
            }

            router.push('/dashboard/employees');
        } catch (error: any) {
            console.error('Failed to save employee:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
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
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-100 rounded"></div>
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">
                            {mode === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa nhân viên'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {mode === 'create' ? 'Điền thông tin nhân viên' : 'Cập nhật thông tin nhân viên'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 border border-slate-200 space-y-6">
                    {/* Basic Info Section */}
                    <div>
                        <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-brandBlue/20">
                            Thông tin cơ bản
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Employee Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Mã nhân viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('employeeCode')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.employeeCode ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="NV001"
                                />
                                {errors.employeeCode && (
                                    <p className="mt-1 text-sm text-red-500">{errors.employeeCode.message}</p>
                                )}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('fullName')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.fullName ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && (
                                    <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.email ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="nguyenvana@company.com"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Số điện thoại
                                </label>
                                <input
                                    {...register('phone')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                    placeholder="0901234567"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ngày sinh <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('dateOfBirth')}
                                    type="date"
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                />
                                {errors.dateOfBirth && (
                                    <p className="mt-1 text-sm text-red-500">{errors.dateOfBirth.message}</p>
                                )}
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Giới tính
                                </label>
                                <select
                                    {...register('gender')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>

                            {/* ID Card */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    CMND/CCCD <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('idCard')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.idCard ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="001234567890"
                                />
                                {errors.idCard && (
                                    <p className="mt-1 text-sm text-red-500">{errors.idCard.message}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Địa chỉ
                                </label>
                                <input
                                    {...register('address')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                    placeholder="123 Đường ABC, Quận XYZ, TP. HCM"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Work Info Section */}
                    <div>
                        <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-secondary/20">
                            Thông tin công việc
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phòng ban <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('departmentId')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.departmentId ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                >
                                    <option value="">Chọn phòng ban</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.departmentId && (
                                    <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
                                )}
                            </div>

                            {/* Position */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Chức vụ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('position')}
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.position ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="Nhân viên"
                                />
                                {errors.position && (
                                    <p className="mt-1 text-sm text-red-500">{errors.position.message}</p>
                                )}
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ngày vào làm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('startDate')}
                                    type="date"
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.startDate ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                />
                                {errors.startDate && (
                                    <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>
                                )}
                            </div>

                            {/* Base Salary */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Lương cơ bản (VNĐ) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('baseSalary')}
                                    type="number"
                                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 ${errors.baseSalary ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    placeholder="10000000"
                                />
                                {errors.baseSalary && (
                                    <p className="mt-1 text-sm text-red-500">{errors.baseSalary.message}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Trạng thái <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('status')}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                >
                                    <option value="ACTIVE">Đang làm việc</option>
                                    <option value="ON_LEAVE">Đang nghỉ</option>
                                    <option value="TERMINATED">Đã nghỉ việc</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex items-center gap-2 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <X size={18} />
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-brandBlue to-[#0047b3] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang lưu...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{mode === 'create' ? 'Tạo mới' : 'Cập nhật'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
