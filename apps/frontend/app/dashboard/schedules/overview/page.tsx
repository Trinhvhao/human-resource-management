'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import employeeService from '@/services/employeeService';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    department: {
        name: string;
    };
}

export default function SchedulesOverviewPage() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeeService.getAll({ status: 'ACTIVE', limit: 500 });

            if (!response || !response.data) {
                console.error('Phản hồi không hợp lệ từ API:', response);
                setEmployees([]);
                return;
            }

            setEmployees(response.data || []);
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            console.error('Chi tiết lỗi:', error.response?.data || error.message);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        const days = [];
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const filteredEmployees = selectedDepartment
        ? employees.filter(emp => emp.department.name === selectedDepartment)
        : employees;

    const departments = [...new Set(employees.map(emp => emp.department.name))];

    return (
        <ProtectedRoute requiredPermission="VIEW_ALL_SCHEDULES">
            <>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Lịch tổng quan</h1>
                            <p className="text-slate-500 mt-1">Xem lịch làm việc của tất cả nhân viên</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter size={20} className="text-slate-600" />
                                <span className="font-semibold">Bộ lọc:</span>
                            </div>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent"
                            >
                                <option value="">Tất cả phòng ban</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                            <div className="ml-auto text-sm text-slate-600">
                                Hiển thị: {filteredEmployees.length} nhân viên
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        {/* Month Navigation */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                onClick={previousMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <ChevronLeft size={20} />
                                Tháng trước
                            </button>
                            <h2 className="text-xl font-bold">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                Tháng sau
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {loading ? (
                            <div className="h-96 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border border-slate-200 p-3 text-left font-semibold sticky left-0 bg-slate-50 z-10">
                                                Nhân viên
                                            </th>
                                            {getDaysInMonth().map((date) => (
                                                <th
                                                    key={date.toISOString()}
                                                    className="border border-slate-200 p-2 text-center min-w-[60px]"
                                                >
                                                    <div className="text-xs text-slate-600">
                                                        {dayNames[date.getDay()]}
                                                    </div>
                                                    <div className="font-bold">{date.getDate()}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((emp) => (
                                            <tr key={emp.id} className="hover:bg-slate-50">
                                                <td className="border border-slate-200 p-3 sticky left-0 bg-white z-10">
                                                    <div>
                                                        <p className="font-semibold text-sm">{emp.fullName}</p>
                                                        <p className="text-xs text-slate-600">{emp.employeeCode}</p>
                                                        <p className="text-xs text-slate-500">{emp.department.name}</p>
                                                    </div>
                                                </td>
                                                {getDaysInMonth().map((date) => {
                                                    const dayOfWeek = date.getDay();
                                                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                                                    return (
                                                        <td
                                                            key={date.toISOString()}
                                                            className={`border border-slate-200 p-1 text-center ${isWeekend ? 'bg-slate-100' : ''
                                                                }`}
                                                        >
                                                            {/* Placeholder - would show actual schedule data */}
                                                            {!isWeekend && (
                                                                <div className="w-full h-8 bg-blue-100 rounded flex items-center justify-center text-xs text-blue-700">
                                                                    8h
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h3 className="font-semibold mb-3">Chú thích:</h3>
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-blue-100 rounded border border-blue-300"></div>
                                <span className="text-sm">Làm việc</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-orange-100 rounded border border-orange-300"></div>
                                <span className="text-sm">Nghỉ phép</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-purple-100 rounded border border-purple-300"></div>
                                <span className="text-sm">Tăng ca</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-100 rounded border border-slate-300"></div>
                                <span className="text-sm">Cuối tuần</span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </ProtectedRoute>
    );
}
