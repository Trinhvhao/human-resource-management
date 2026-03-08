'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import employeeService from '@/services/employeeService';
import calendarService from '@/services/calendarService';
import ScheduleModal from '@/components/calendar/ScheduleModal';
import BulkScheduleModal from '@/components/calendar/BulkScheduleModal';
import FullCalendarView from '@/components/calendar/FullCalendarView';

// RBAC
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { usePermission } from '@/hooks/usePermission';

interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    department: {
        name: string;
    };
}

export default function SchedulesManagementPage() {
    const router = useRouter();
    const { can } = usePermission();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [events, setEvents] = useState<any[]>([]);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            fetchEmployeeSchedules();
        }
    }, [selectedEmployee]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeeService.getAll({ status: 'ACTIVE', limit: 500 });

            if (!response || !response.data) {
                console.error('Invalid response from API:', response);
                setEmployees([]);
                return;
            }

            setEmployees(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedEmployee(response.data[0].id);
            }
        } catch (error: any) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            console.error('Error details:', error.response?.data || error.message);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeSchedules = async () => {
        if (!selectedEmployee) return;

        try {
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const response = await calendarService.getMyCalendar(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
            setEvents(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải lịch làm việc:', error);
        }
    };

    const handleScheduleSuccess = () => {
        fetchEmployeeSchedules();
    };

    // Convert events to FullCalendar format
    const fullCalendarEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        allDay: event.allDay,
        extendedProps: {
            type: event.type,
            description: event.description
        }
    }));

    const handleEventClick = (info: EventClickArg) => {
        const event = events.find(e => e.id === info.event.id);
        if (event && event.type === 'work') {
            setSelectedScheduleId(event.id);
            setIsScheduleModalOpen(true);
        }
    };

    const handleDateSelect = (info: DateSelectArg) => {
        setSelectedDate(info.start);
        setIsScheduleModalOpen(true);
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = !selectedDepartment || emp.department.name === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

    // Get unique departments for filter
    const departments = [...new Set(employees.map(emp => emp.department.name))].sort();

    return (
        <ProtectedRoute requiredPermission="VIEW_ALL_SCHEDULES">
            <>
                <div className="space-y-6">
                    {/* Header with improved action buttons */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Ca làm việc</h1>
                            <p className="text-slate-500 mt-1">Quản lý lịch làm việc chi tiết từng nhân viên</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsBulkScheduleModalOpen(true)}
                                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                            >
                                <Users size={18} />
                                Tạo hàng loạt
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedScheduleId(undefined);
                                    setSelectedDate(null);
                                    setIsScheduleModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                            >
                                <Plus size={18} />
                                Tạo lịch
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Collapsible Employee Sidebar */}
                        {!isSidebarCollapsed && (
                            <div className="lg:col-span-3">
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                                    {/* Sidebar Header */}
                                    <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Users size={20} className="text-brandBlue" />
                                                <h3 className="font-bold text-lg text-primary">Nhân viên</h3>
                                            </div>
                                            <button
                                                onClick={() => setIsSidebarCollapsed(true)}
                                                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                                title="Thu gọn"
                                            >
                                                <ChevronLeft size={18} className="text-slate-600" />
                                            </button>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <span className="font-semibold">{filteredEmployees.length}</span>
                                            <span>nhân viên</span>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        {/* Advanced Filters */}
                                        <div className="space-y-3 mb-4">
                                            {/* Search */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Tìm theo tên, mã NV..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent text-sm"
                                                />
                                            </div>

                                            {/* Department Filter */}
                                            <div className="relative">
                                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <select
                                                    value={selectedDepartment}
                                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brandBlue focus:border-transparent text-sm appearance-none bg-white"
                                                >
                                                    <option value="">Tất cả phòng ban</option>
                                                    {departments.map((dept) => (
                                                        <option key={dept} value={dept}>
                                                            {dept}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Employee List */}
                                        <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '600px' }}>
                                            {loading ? (
                                                <div className="text-center py-12">
                                                    <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                    <p className="text-sm text-slate-500 mt-3">Đang tải...</p>
                                                </div>
                                            ) : filteredEmployees.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Users size={48} className="mx-auto text-slate-300 mb-3" />
                                                    <p className="text-slate-500">Không tìm thấy nhân viên</p>
                                                </div>
                                            ) : (
                                                filteredEmployees.map((emp) => (
                                                    <button
                                                        key={emp.id}
                                                        onClick={() => setSelectedEmployee(emp.id)}
                                                        className={`w-full text-left p-3 rounded-lg transition-all ${selectedEmployee === emp.id
                                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-brandBlue shadow-sm'
                                                            : 'hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
                                                            }`}
                                                    >
                                                        <p className="font-semibold text-sm text-primary">{emp.fullName}</p>
                                                        <p className="text-xs text-slate-600 mt-0.5">{emp.employeeCode}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                            <p className="text-xs text-slate-500">{emp.department.name}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collapsed Sidebar Button */}
                        {isSidebarCollapsed && (
                            <div className="lg:col-span-1">
                                <button
                                    onClick={() => setIsSidebarCollapsed(false)}
                                    className="w-full bg-white rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors shadow-sm"
                                    title="Mở rộng"
                                >
                                    <ChevronRight size={20} className="mx-auto text-slate-600" />
                                    <Users size={20} className="mx-auto text-brandBlue mt-2" />
                                    <p className="text-xs text-slate-600 mt-2 font-semibold">Nhân viên</p>
                                </button>
                            </div>
                        )}

                        {/* Calendar View - Expanded when sidebar collapsed */}
                        <div className={isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'}>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                                {selectedEmployeeData ? (
                                    <>
                                        {/* Employee Info Header */}
                                        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brandBlue to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                        {selectedEmployeeData.fullName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-primary">{selectedEmployeeData.fullName}</h3>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-sm text-slate-600 font-medium">{selectedEmployeeData.employeeCode}</span>
                                                            <span className="text-slate-400">•</span>
                                                            <span className="text-sm text-slate-600">{selectedEmployeeData.department.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedScheduleId(undefined);
                                                        setSelectedDate(null);
                                                        setIsScheduleModalOpen(true);
                                                    }}
                                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-semibold"
                                                >
                                                    <Plus size={16} />
                                                    Thêm lịch
                                                </button>
                                            </div>
                                        </div>

                                        {/* Calendar Content */}
                                        <div className="p-6">
                                            {/* Legend with improved styling */}
                                            <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-6 flex-wrap">
                                                    <span className="text-sm font-semibold text-slate-700">Chú thích:</span>
                                                    {[
                                                        { type: 'work', label: 'Làm việc', color: 'bg-blue-500', border: 'border-blue-600' },
                                                        { type: 'leave', label: 'Nghỉ phép', color: 'bg-orange-500', border: 'border-orange-600' },
                                                        { type: 'overtime', label: 'Tăng ca', color: 'bg-purple-500', border: 'border-purple-600' },
                                                        { type: 'holiday', label: 'Ngày lễ', color: 'bg-red-500', border: 'border-red-600' },
                                                    ].map((item) => (
                                                        <div key={item.type} className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded ${item.color} border-2 ${item.border} shadow-sm`}></div>
                                                            <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                    <span className="font-semibold">{events.filter(e => e.type === 'work').length}</span> ca làm việc
                                                </div>
                                            </div>

                                            {/* FullCalendar with enhanced styling */}
                                            <div className="calendar-container">
                                                <FullCalendarView
                                                    events={fullCalendarEvents}
                                                    onEventClick={handleEventClick}
                                                    onDateSelect={handleDateSelect}
                                                    editable={true}
                                                    selectable={true}
                                                    initialView="timeGridWeek"
                                                    height={600}
                                                    headerToolbar={{
                                                        left: 'prev,next today',
                                                        center: 'title',
                                                        right: 'timeGridWeek,timeGridDay'
                                                    }}
                                                />
                                            </div>

                                            {/* Quick Tips */}
                                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <CalendarIcon size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                                    <div className="text-sm text-blue-900">
                                                        <p className="font-semibold mb-1">Mẹo sử dụng:</p>
                                                        <ul className="space-y-1 text-blue-800">
                                                            <li>• Click vào ca làm việc để chỉnh sửa</li>
                                                            <li>• Click vào ô trống để tạo ca mới nhanh</li>
                                                            <li>• Kéo thả để thay đổi thời gian (sắp có)</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-24">
                                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                            <Users size={40} className="text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Chọn nhân viên</h3>
                                        <p className="text-slate-500">Chọn nhân viên từ danh sách bên trái để xem và quản lý lịch làm việc</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Schedule Modal */}
                    <ScheduleModal
                        isOpen={isScheduleModalOpen}
                        onClose={() => setIsScheduleModalOpen(false)}
                        onSuccess={handleScheduleSuccess}
                        scheduleId={selectedScheduleId}
                        initialDate={selectedDate || undefined}
                        employeeId={selectedEmployee}
                    />

                    {/* Bulk Schedule Modal */}
                    <BulkScheduleModal
                        isOpen={isBulkScheduleModalOpen}
                        onClose={() => setIsBulkScheduleModalOpen(false)}
                        onSuccess={handleScheduleSuccess}
                    />
                </div>

                <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                .calendar-container .fc {
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                
                .calendar-container .fc-timegrid-slot {
                    height: 2.5rem;
                }
                
                .calendar-container .fc-col-header-cell {
                    background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
                    font-weight: 700;
                    padding: 1rem 0;
                }
                
                .calendar-container .fc-timegrid-axis {
                    background: #f8fafc;
                }
                
                .calendar-container .fc-event {
                    border-width: 2px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .calendar-container .fc-event:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `}</style>
            </>
        </ProtectedRoute>
    );
}
