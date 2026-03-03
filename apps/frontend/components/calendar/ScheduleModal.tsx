'use client';

import { useState, useEffect } from 'react';
import { X, Clock, Calendar, User, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import calendarService from '@/services/calendarService';
import employeeService from '@/services/employeeService';
import authService from '@/services/authService';
import { ShiftType } from '@/types/calendar';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    scheduleId?: string;
    initialDate?: Date;
    employeeId?: string; // For HR/Admin to create schedule for specific employee
}

interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    status: string;
}

export default function ScheduleModal({
    isOpen,
    onClose,
    onSuccess,
    scheduleId,
    initialDate,
    employeeId,
}: ScheduleModalProps) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: employeeId || '',
        date: initialDate ? initialDate.toISOString().split('T')[0] : '',
        shiftType: ShiftType.FULL_DAY,
        startTime: '08:30',
        endTime: '17:30',
        isWorkDay: true,
        notes: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isHROrAdmin, setIsHROrAdmin] = useState(false);

    useEffect(() => {
        const user = authService.getUser();
        setCurrentUser(user);
        setIsHROrAdmin(user?.role === 'ADMIN' || user?.role === 'HR_MANAGER');

        if (user?.role === 'ADMIN' || user?.role === 'HR_MANAGER') {
            fetchEmployees();
        } else if (user?.employeeId) {
            // Regular user can only see their own schedule
            setFormData(prev => ({ ...prev, employeeId: user.employeeId || '' }));
        }
    }, []);

    useEffect(() => {
        if (scheduleId) {
            fetchSchedule();
        } else {
            resetForm();
        }
    }, [scheduleId, initialDate, employeeId]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const response = await employeeService.getAll({ status: 'ACTIVE', limit: 500 });

            if (!response || !response.data) {
                console.error('Invalid response from API:', response);
                setEmployees([]);
                return;
            }

            setEmployees(response.data || []);
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            console.error('Error details:', error.response?.data || error.message);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchSchedule = async () => {
        if (!scheduleId) return;

        try {
            setLoading(true);
            const response = await calendarService.getSchedule(scheduleId);
            const schedule = response.data;

            // Parse times
            const startTime = new Date(schedule.startTime);
            const endTime = new Date(schedule.endTime);

            setFormData({
                employeeId: schedule.employeeId,
                date: new Date(schedule.date).toISOString().split('T')[0],
                shiftType: schedule.shiftType,
                startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
                endTime: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
                isWorkDay: schedule.isWorkDay,
                notes: schedule.notes || '',
            });
        } catch (error) {
            console.error('Lỗi khi tải lịch làm việc:', error);
            alert('Không thể tải thông tin lịch làm việc');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            employeeId: employeeId || currentUser?.employeeId || '',
            date: initialDate ? initialDate.toISOString().split('T')[0] : '',
            shiftType: ShiftType.FULL_DAY,
            startTime: '08:30',
            endTime: '17:30',
            isWorkDay: true,
            notes: '',
        });
        setErrors({});
    };

    const handleShiftTypeChange = (shiftType: ShiftType) => {
        let startTime = '08:30';
        let endTime = '17:30';

        switch (shiftType) {
            case ShiftType.MORNING:
                startTime = '08:00';
                endTime = '12:00';
                break;
            case ShiftType.AFTERNOON:
                startTime = '13:00';
                endTime = '17:30';
                break;
            case ShiftType.FULL_DAY:
                startTime = '08:30';
                endTime = '17:30';
                break;
            case ShiftType.NIGHT:
                startTime = '18:00';
                endTime = '22:00';
                break;
        }

        setFormData(prev => ({ ...prev, shiftType, startTime, endTime }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.employeeId) {
            newErrors.employeeId = 'Vui lòng chọn nhân viên';
        }

        if (!formData.date) {
            newErrors.date = 'Vui lòng chọn ngày';
        }

        if (!formData.startTime) {
            newErrors.startTime = 'Vui lòng nhập giờ bắt đầu';
        }

        if (!formData.endTime) {
            newErrors.endTime = 'Vui lòng nhập giờ kết thúc';
        }

        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
            newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);

            // Combine date and time
            const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
            const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

            const payload = {
                employeeId: formData.employeeId,
                date: formData.date,
                shiftType: formData.shiftType,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                isWorkDay: formData.isWorkDay,
                notes: formData.notes || undefined,
            };

            if (scheduleId) {
                await calendarService.updateSchedule(scheduleId, payload);
            } else {
                await calendarService.createSchedule(payload);
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error: any) {
            console.error('Lỗi khi lưu lịch làm việc:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch làm việc';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-primary">
                            {scheduleId ? 'Chỉnh sửa lịch làm việc' : 'Tạo lịch làm việc'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Employee Selection (HR/Admin only) */}
                        {isHROrAdmin && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <User size={16} className="inline mr-2" />
                                    Nhân viên <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.employeeId ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    disabled={loading || loadingEmployees || !!scheduleId}
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.employeeCode} - {emp.fullName}
                                        </option>
                                    ))}
                                </select>
                                {errors.employeeId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>
                                )}
                            </div>
                        )}

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <Calendar size={16} className="inline mr-2" />
                                Ngày làm việc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.date ? 'border-red-500' : 'border-slate-300'
                                    }`}
                                disabled={loading}
                            />
                            {errors.date && (
                                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                            )}
                        </div>

                        {/* Shift Type */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Ca làm việc <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {[
                                    { value: ShiftType.MORNING, label: 'Sáng' },
                                    { value: ShiftType.AFTERNOON, label: 'Chiều' },
                                    { value: ShiftType.FULL_DAY, label: 'Cả ngày' },
                                    { value: ShiftType.NIGHT, label: 'Tối' },
                                    { value: ShiftType.CUSTOM, label: 'Tùy chỉnh' },
                                ].map((shift) => (
                                    <button
                                        key={shift.value}
                                        type="button"
                                        onClick={() => handleShiftTypeChange(shift.value)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all ${formData.shiftType === shift.value
                                            ? 'border-brandBlue bg-blue-50 text-brandBlue font-semibold'
                                            : 'border-slate-300 hover:border-slate-400'
                                            }`}
                                        disabled={loading}
                                    >
                                        {shift.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Clock size={16} className="inline mr-2" />
                                    Giờ bắt đầu <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.startTime ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    disabled={loading}
                                />
                                {errors.startTime && (
                                    <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Clock size={16} className="inline mr-2" />
                                    Giờ kết thúc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.endTime ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    disabled={loading}
                                />
                                {errors.endTime && (
                                    <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                                )}
                            </div>
                        </div>

                        {/* Is Work Day */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isWorkDay"
                                checked={formData.isWorkDay}
                                onChange={(e) => setFormData({ ...formData, isWorkDay: e.target.checked })}
                                className="w-5 h-5 text-brandBlue border-slate-300 rounded focus:ring-brandBlue"
                                disabled={loading}
                            />
                            <label htmlFor="isWorkDay" className="text-sm font-medium text-slate-700">
                                Ngày làm việc chính thức
                            </label>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                <FileText size={16} className="inline mr-2" />
                                Ghi chú
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent resize-none"
                                placeholder="Nhập ghi chú (nếu có)..."
                                disabled={loading}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-3 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading && (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                )}
                                {scheduleId ? 'Cập nhật' : 'Tạo lịch'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
