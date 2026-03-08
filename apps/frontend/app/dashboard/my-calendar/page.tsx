'use client';

import { useEffect, useState } from 'react';
import { Clock, Briefcase, Umbrella, Award, Plus, Edit, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import calendarService from '@/services/calendarService';
import { CalendarEvent, CalendarStats } from '@/types/calendar';
import ScheduleModal from '@/components/calendar/ScheduleModal';
import BulkScheduleModal from '@/components/calendar/BulkScheduleModal';
import FullCalendarView from '@/components/calendar/FullCalendarView';

// RBAC
import { usePermission } from '@/hooks/usePermission';

export default function MyCalendarPage() {
    const { can } = usePermission();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [stats, setStats] = useState<CalendarStats>({
        workDays: 0,
        leaveDays: 0,
        overtimeHours: 0,
        holidays: 0,
    });
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isBulkScheduleModalOpen, setIsBulkScheduleModalOpen] = useState(false);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>();

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Initial stats fetch (by current month)
    useEffect(() => {
        fetchStats();
    }, [currentMonth, currentYear]);

    const fetchStats = async () => {
        try {
            const statsRes = await calendarService.getCalendarStats(currentMonth + 1, currentYear);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Lỗi khi tải thống kê:', error);
        }
    };

    // Called by FullCalendar whenever the visible date range changes (view switch, prev/next navigation)
    const handleDatesSet = async (start: Date, end: Date) => {
        setCurrentDate(start);
        setVisibleRange({ start, end });
        try {
            setLoading(true);
            const eventsRes = await calendarService.getMyCalendar(
                start.toISOString().split('T')[0],
                // FullCalendar end is exclusive, subtract 1 day
                new Date(end.getTime() - 86400000).toISOString().split('T')[0]
            );
            setEvents(eventsRes.data ?? []);
        } catch (error) {
            console.error('Lỗi khi tải lịch:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarData = async () => {
        if (!visibleRange) return;
        await handleDatesSet(visibleRange.start, visibleRange.end);
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
        if (event && can('EDIT_SCHEDULE') && event.type === 'work') {
            setSelectedScheduleId(event.id);
            setIsScheduleModalOpen(true);
        }
    };

    const handleDateSelect = (info: DateSelectArg) => {
        if (can('CREATE_SCHEDULE')) {
            setSelectedDate(info.start);
            setIsScheduleModalOpen(true);
        }
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
    };

    const handleCreateSchedule = (date?: Date) => {
        setSelectedScheduleId(undefined);
        setSelectedDate(date || null);
        setIsScheduleModalOpen(true);
    };

    const handleEditSchedule = (scheduleId: string) => {
        setSelectedScheduleId(scheduleId);
        setIsScheduleModalOpen(true);
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) return;

        try {
            await calendarService.deleteSchedule(scheduleId);
            fetchCalendarData();
        } catch (error) {
            console.error('Lỗi khi xóa lịch làm việc:', error);
            alert('Có lỗi xảy ra khi xóa lịch làm việc');
        }
    };

    const handleScheduleSuccess = () => {
        fetchCalendarData();
    };

    const getEventsForDate = (date: Date) => {
        return events.filter(event => {
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(0, 0, 0, 0);
            return checkDate >= eventStart && checkDate <= eventEnd;
        });
    };

    const getEventColor = (type: string) => {
        const colors = {
            work: 'bg-blue-500',
            leave: 'bg-orange-500',
            overtime: 'bg-purple-500',
            holiday: 'bg-red-500',
        };
        return colors[type as keyof typeof colors] || 'bg-gray-500';
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-primary">Lịch làm việc</h1>
                    <p className="text-slate-500 mt-1">Xem lịch làm việc, nghỉ phép và tăng ca của bạn</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Ngày làm việc', value: stats.workDays, color: 'blue', icon: Briefcase },
                        { label: 'Ngày nghỉ phép', value: stats.leaveDays, color: 'orange', icon: Umbrella },
                        { label: 'Giờ tăng ca', value: `${stats.overtimeHours}h`, color: 'purple', icon: Clock },
                        { label: 'Ngày lễ', value: stats.holidays, color: 'red', icon: Award },
                    ].map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl p-6 border border-slate-200"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                                        <Icon className={`text-${stat.color}-600`} size={20} />
                                    </div>
                                    <p className="text-sm text-slate-600">{stat.label}</p>
                                </div>
                                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">
                            Lịch làm việc của tôi
                        </h2>

                        <div className="flex items-center gap-3">
                            {can('CREATE_SCHEDULE') && (
                                <>
                                    <button
                                        onClick={() => setIsBulkScheduleModalOpen(true)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                    >
                                        <Users size={18} />
                                        Tạo hàng loạt
                                    </button>
                                    <button
                                        onClick={() => handleCreateSchedule()}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Tạo lịch
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                        {[
                            { type: 'work', label: 'Làm việc', color: 'bg-blue-500' },
                            { type: 'leave', label: 'Nghỉ phép', color: 'bg-orange-500' },
                            { type: 'overtime', label: 'Tăng ca', color: 'bg-purple-500' },
                            { type: 'holiday', label: 'Ngày lễ', color: 'bg-red-500' },
                        ].map((item) => (
                            <div key={item.type} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                <span className="text-sm text-slate-600">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* FullCalendar - always rendered, datesSet drives data loading */}
                    <div className="relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
                                <div className="w-8 h-8 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <FullCalendarView
                            events={fullCalendarEvents}
                            onEventClick={handleEventClick}
                            onDateSelect={handleDateSelect}
                            onDateClick={handleDateClick}
                            onDatesSet={handleDatesSet}
                            editable={can('EDIT_SCHEDULE')}
                            selectable={can('CREATE_SCHEDULE')}
                            initialView="dayGridMonth"
                            height="auto"
                        />
                    </div>
                </div>

                {/* Selected Date Events */}
                {selectedDate && (
                    <div className="bg-white rounded-xl p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">
                                Sự kiện ngày {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                            </h3>
                            {can('CREATE_SCHEDULE') && (
                                <button
                                    onClick={() => handleCreateSchedule(selectedDate)}
                                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} />
                                    Thêm lịch
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {getEventsForDate(selectedDate).map((event) => (
                                <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className={`w-3 h-3 rounded-full mt-1 ${getEventColor(event.type)}`}></div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{event.title}</p>
                                        {event.description && (
                                            <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">
                                            {event.allDay ? 'Cả ngày' : `${new Date(event.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                                        </p>
                                    </div>
                                    {can('EDIT_SCHEDULE') && event.type === 'work' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditSchedule(event.id)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSchedule(event.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {getEventsForDate(selectedDate).length === 0 && (
                                <p className="text-slate-500 text-center py-4">Không có sự kiện nào</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Schedule Modal */}
                <ScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    onSuccess={handleScheduleSuccess}
                    scheduleId={selectedScheduleId}
                    initialDate={selectedDate || undefined}
                />

                {/* Bulk Schedule Modal */}
                <BulkScheduleModal
                    isOpen={isBulkScheduleModalOpen}
                    onClose={() => setIsBulkScheduleModalOpen(false)}
                    onSuccess={handleScheduleSuccess}
                />
            </div>
        </>
    );
}
