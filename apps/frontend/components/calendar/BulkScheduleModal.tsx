'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import calendarService from '@/services/calendarService';
import employeeService from '@/services/employeeService';
import { ShiftType } from '@/types/calendar';

interface BulkScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    status: string;
}

export default function BulkScheduleModal({ isOpen, onClose, onSuccess }: BulkScheduleModalProps) {
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        shiftType: ShiftType.FULL_DAY,
        startTime: '08:30',
        endTime: '17:30',
        notes: '',
        excludeWeekends: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            resetForm();
        }
    }, [isOpen]);

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

    const resetForm = () => {
        setFormData({
            startDate: '',
            endDate: '',
            shiftType: ShiftType.FULL_DAY,
            startTime: '08:30',
            endTime: '17:30',
            notes: '',
            excludeWeekends: true,
        });
        setSelectedEmployees([]);
        setErrors({});
        setResult(null);
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

    const toggleEmployee = (employeeId: string) => {
        setSelectedEmployees(prev =>
            prev.includes(employeeId)
                ? prev.filter(id => id !== employeeId)
                : [...prev, employeeId]
        );
    };

    const toggleAllEmployees = () => {
        if (selectedEmployees.length === employees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(employees.map(emp => emp.id));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (selectedEmployees.length === 0) {
            newErrors.employees = 'Vui lòng chọn ít nhất 1 nhân viên';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
        }

        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
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

    const generateSchedules = () => {
        const schedules = [];
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            // Skip weekends if excludeWeekends is true
            if (formData.excludeWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
                continue;
            }

            const dateStr = date.toISOString().split('T')[0];

            for (const employeeId of selectedEmployees) {
                const startDateTime = new Date(`${dateStr}T${formData.startTime}:00`);
                const endDateTime = new Date(`${dateStr}T${formData.endTime}:00`);

                schedules.push({
                    employeeId,
                    date: dateStr,
                    shiftType: formData.shiftType,
                    startTime: startDateTime.toISOString(),
                    endTime: endDateTime.toISOString(),
                    notes: formData.notes || undefined,
                });
            }
        }

        return schedules;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            setLoading(true);
            setResult(null);

            const schedules = generateSchedules();

            if (schedules.length === 0) {
                alert('Không có lịch nào được tạo. Vui lòng kiểm tra lại ngày và cài đặt.');
                return;
            }

            if (schedules.length > 500) {
                if (!confirm(`Bạn sắp tạo ${schedules.length} lịch làm việc. Tiếp tục?`)) {
                    return;
                }
            }

            const response = await calendarService.bulkCreateSchedules({ schedules });
            setResult(response.data);

            if (response.data.success === schedules.length) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                    resetForm();
                }, 2000);
            }
        } catch (error: any) {
            console.error('Lỗi khi tạo lịch hàng loạt:', error);
            const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi tạo lịch hàng loạt';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalSchedules = (() => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        let count = 0;
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            if (!formData.excludeWeekends || (date.getDay() !== 0 && date.getDay() !== 6)) {
                count++;
            }
        }
        return count * selectedEmployees.length;
    })();

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-bold text-primary">Tạo lịch hàng loạt</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Employee Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-slate-700">
                                    <Users size={16} className="inline mr-2" />
                                    Chọn nhân viên <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={toggleAllEmployees}
                                    className="text-sm text-brandBlue hover:underline"
                                >
                                    {selectedEmployees.length === employees.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </button>
                            </div>
                            <div className="border border-slate-300 rounded-lg max-h-60 overflow-y-auto">
                                {loadingEmployees ? (
                                    <div className="p-4 text-center text-slate-500">Đang tải...</div>
                                ) : employees.length === 0 ? (
                                    <div className="p-4 text-center text-slate-500">Không có nhân viên nào</div>
                                ) : (
                                    <div className="divide-y divide-slate-200">
                                        {employees.map((emp) => (
                                            <label
                                                key={emp.id}
                                                className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEmployees.includes(emp.id)}
                                                    onChange={() => toggleEmployee(emp.id)}
                                                    className="w-4 h-4 text-brandBlue border-slate-300 rounded focus:ring-brandBlue"
                                                />
                                                <span className="text-sm">
                                                    {emp.employeeCode} - {emp.fullName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.employees && (
                                <p className="text-red-500 text-sm mt-1">{errors.employees}</p>
                            )}
                            <p className="text-sm text-slate-600 mt-2">
                                Đã chọn: {selectedEmployees.length} nhân viên
                            </p>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Calendar size={16} className="inline mr-2" />
                                    Từ ngày <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.startDate ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    disabled={loading}
                                />
                                {errors.startDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    <Calendar size={16} className="inline mr-2" />
                                    Đến ngày <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent ${errors.endDate ? 'border-red-500' : 'border-slate-300'
                                        }`}
                                    disabled={loading}
                                />
                                {errors.endDate && (
                                    <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                                )}
                            </div>
                        </div>

                        {/* Exclude Weekends */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="excludeWeekends"
                                checked={formData.excludeWeekends}
                                onChange={(e) => setFormData({ ...formData, excludeWeekends: e.target.checked })}
                                className="w-5 h-5 text-brandBlue border-slate-300 rounded focus:ring-brandBlue"
                                disabled={loading}
                            />
                            <label htmlFor="excludeWeekends" className="text-sm font-medium text-slate-700">
                                Bỏ qua cuối tuần (Thứ 7 & Chủ nhật)
                            </label>
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

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent resize-none"
                                placeholder="Nhập ghi chú chung cho tất cả lịch..."
                                disabled={loading}
                            />
                        </div>

                        {/* Summary */}
                        {totalSchedules > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="font-semibold text-blue-900">Tổng quan</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Sẽ tạo <span className="font-bold">{totalSchedules}</span> lịch làm việc cho{' '}
                                            <span className="font-bold">{selectedEmployees.length}</span> nhân viên
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className={`border rounded-lg p-4 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className={`flex-shrink-0 mt-0.5 ${result.failed === 0 ? 'text-green-600' : 'text-yellow-600'
                                        }`} size={20} />
                                    <div className="flex-1">
                                        <p className="font-semibold">Kết quả</p>
                                        <p className="text-sm mt-1">
                                            Thành công: <span className="font-bold text-green-600">{result.success}</span> |{' '}
                                            Thất bại: <span className="font-bold text-red-600">{result.failed}</span>
                                        </p>
                                        {result.errors && result.errors.length > 0 && (
                                            <div className="mt-3 max-h-40 overflow-y-auto">
                                                <p className="text-sm font-semibold mb-2">Chi tiết lỗi:</p>
                                                <div className="space-y-1">
                                                    {result.errors.slice(0, 10).map((err: any, idx: number) => (
                                                        <p key={idx} className="text-xs text-red-600">
                                                            • {err.date} - {err.error}
                                                        </p>
                                                    ))}
                                                    {result.errors.length > 10 && (
                                                        <p className="text-xs text-slate-600">
                                                            ... và {result.errors.length - 10} lỗi khác
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                disabled={loading}
                            >
                                {result ? 'Đóng' : 'Hủy'}
                            </button>
                            {!result && (
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={loading || totalSchedules === 0}
                                >
                                    {loading && (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    Tạo {totalSchedules} lịch
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
