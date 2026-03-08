'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Calendar, Building, Briefcase, MapPin, Edit, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import employeeService from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { formatDate } from '@/utils/formatters';
import Avatar from '@/components/common/Avatar';

export default function ProfilePage() {
    const { user } = useAuthStore();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        address: '',
    });

    const isEmployee = user?.role === 'EMPLOYEE';

    useEffect(() => {
        if (user?.employeeId) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user?.employeeId) return;

        try {
            setLoading(true);
            // Use /profile endpoint which allows EMPLOYEE role; getById only allows ADMIN/HR_MANAGER/MANAGER
            const response = await employeeService.getProfile(user.employeeId);
            const data = response.data?.data || response.data;
            setEmployee(data);
            setFormData({
                phone: data?.phone || '',
                address: data?.address || '',
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.employeeId) return;

        try {
            await employeeService.update(user.employeeId, formData);
            await fetchProfile();
            setEditing(false);
            alert('Cập nhật thông tin thành công!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Cập nhật thất bại!');
        }
    };

    if (loading) {
        return (
            <>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 rounded w-48"></div>
                    <div className="bg-white rounded-2xl p-8 space-y-6">
                        <div className="h-32 bg-slate-100 rounded-2xl"></div>
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!employee) return null;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Hồ sơ cá nhân</h1>
                        <p className="text-slate-500 mt-1">Quản lý thông tin cá nhân của bạn</p>
                    </div>
                    {!editing ? (
                        // EMPLOYEE role cannot update via /employees/:id endpoint
                        !isEmployee && (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-brandBlue to-[#0047b3] text-white rounded-lg hover:shadow-lg transition-all"
                        >
                            <Edit size={18} />
                            Chỉnh sửa
                        </button>
                        )
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setEditing(false)}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                            >
                                <X size={18} />
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all"
                            >
                                <Save size={18} />
                                Lưu
                            </button>
                        </div>
                    )}
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200"
                >
                    {/* Header with Avatar */}
                    <div className="bg-linear-to-r from-brandBlue to-[#0047b3] p-8 rounded-t-2xl">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-white">
                                <Avatar
                                    src={employee.avatarUrl}
                                    name={employee.fullName}
                                    alt={employee.fullName}
                                    className="w-full! h-full! rounded-none! border-0"
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{employee.fullName}</h2>
                                <p className="text-brandLightBlue text-lg mt-1">{employee.position}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white">
                                        {employee.employeeCode}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm ${employee.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                                            employee.status === 'ON_LEAVE' ? 'bg-yellow-500 text-white' :
                                                'bg-red-500 text-white'
                                        }`}>
                                        {employee.status === 'ACTIVE' ? 'Đang làm việc' :
                                            employee.status === 'ON_LEAVE' ? 'Đang nghỉ' : 'Đã nghỉ việc'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <Mail className="text-blue-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Email</p>
                                <p className="text-base font-semibold text-primary">{employee.email}</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                                <Phone className="text-green-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Số điện thoại</p>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                        placeholder="Nhập số điện thoại"
                                    />
                                ) : (
                                    <p className="text-base font-semibold text-primary">{employee.phone || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                                <Calendar className="text-purple-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Ngày sinh</p>
                                <p className="text-base font-semibold text-primary">{formatDate(employee.dateOfBirth)}</p>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-brandBlue/10 rounded-xl flex items-center justify-center shrink-0">
                                <Building className="text-brandBlue" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Phòng ban</p>
                                <p className="text-base font-semibold text-primary">{employee.department?.name}</p>
                            </div>
                        </div>

                        {/* Position */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                                <Briefcase className="text-secondary" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Chức vụ</p>
                                <p className="text-base font-semibold text-primary">{employee.position}</p>
                            </div>
                        </div>

                        {/* Start Date */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                                <Calendar className="text-yellow-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Ngày vào làm</p>
                                <p className="text-base font-semibold text-primary">{formatDate(employee.startDate)}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-4 md:col-span-2">
                            <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin className="text-pink-600" size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-500 mb-1">Địa chỉ</p>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20"
                                        placeholder="Nhập địa chỉ"
                                    />
                                ) : (
                                    <p className="text-base font-semibold text-primary">{employee.address || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Documents */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200"
                    >
                        <h3 className="text-lg font-bold text-primary mb-4">Thông tin cá nhân</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">Giới tính</span>
                                <span className="font-semibold text-primary">{employee.gender || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-100">
                                <span className="text-slate-600">CMND/CCCD</span>
                                <span className="font-semibold text-primary">{employee.idCard}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Work Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-6 border border-slate-200"
                    >
                        <h3 className="text-lg font-bold text-primary mb-4">Thống kê công việc</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Số ngày phép', value: '12', color: 'blue' },
                                { label: 'Ngày công', value: '22', color: 'green' },
                                { label: 'Đơn chờ', value: '2', color: 'yellow' },
                                { label: 'Hợp đồng', value: '1', color: 'purple' },
                            ].map((stat, index) => (
                                <div key={index} className="bg-slate-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
