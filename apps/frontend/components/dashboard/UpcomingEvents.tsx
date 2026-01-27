'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: 'MEETING' | 'TRAINING' | 'HOLIDAY' | 'BIRTHDAY';
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const axiosInstance = (await import('@/lib/axios')).default;
      
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      console.log('Fetching events...');
      
      // Fetch upcoming leave requests and employees (no limit param to avoid type issues)
      const [leaveRequests, employees] = await Promise.all([
        axiosInstance.get('/leave-requests', {
          params: { status: 'APPROVED' }
        }),
        axiosInstance.get('/employees')
      ]);

      console.log('Leave requests:', leaveRequests);
      console.log('Employees:', employees);

      const upcomingEvents: Event[] = [];

      // Add approved leave requests as events
      if (leaveRequests.data) {
        leaveRequests.data.slice(0, 50).forEach((leave: any) => {
          const startDate = new Date(leave.startDate);
          if (startDate >= now && startDate <= nextWeek) {
            upcomingEvents.push({
              id: `leave-${leave.id}`,
              title: `Nghỉ phép: ${leave.employee?.fullName || 'N/A'}`,
              date: leave.startDate,
              time: 'Cả ngày',
              location: leave.leaveType || 'Nghỉ phép',
              attendees: 1,
              type: 'HOLIDAY',
            });
          }
        });
      }

      // Add some birthday events from employees
      if (employees.data) {
        employees.data.slice(0, 10).forEach((emp: any) => {
          if (emp.dateOfBirth) {
            const birthday = new Date(emp.dateOfBirth);
            const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
            
            if (thisYearBirthday >= now && thisYearBirthday <= nextWeek) {
              upcomingEvents.push({
                id: `birthday-${emp.id}`,
                title: `Sinh nhật ${emp.fullName}`,
                date: thisYearBirthday.toISOString().split('T')[0],
                time: '12:00',
                location: 'Phòng ăn',
                attendees: 20,
                type: 'BIRTHDAY',
              });
            }
          }
        });
      }

      // Sort by date
      upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      console.log('Upcoming events:', upcomingEvents);
      setEvents(upcomingEvents.slice(0, 4)); // Show only 4 events
    } catch (error: any) {
      console.error('Failed to fetch events:', {
        message: error?.message,
        statusCode: error?.statusCode,
        response: error?.response,
        error: error
      });
      // Set empty array on error (e.g., not authenticated)
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'MEETING':
        return { bg: 'bg-blue-100', text: 'text-blue-600', icon: '📅' };
      case 'TRAINING':
        return { bg: 'bg-purple-100', text: 'text-purple-600', icon: '📚' };
      case 'BIRTHDAY':
        return { bg: 'bg-pink-100', text: 'text-pink-600', icon: '🎂' };
      case 'HOLIDAY':
        return { bg: 'bg-green-100', text: 'text-green-600', icon: '🎉' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', icon: '📌' };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-primary">Sự kiện sắp tới</h3>
          <p className="text-sm text-slate-500 mt-1">Tuần này</p>
        </div>
        <Calendar className="text-brandBlue" size={24} />
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Calendar className="mx-auto mb-2" size={40} />
            <p>Không có sự kiện nào</p>
          </div>
        ) : (
          events.map((event, index) => {
            const colors = getEventColor(event.type);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 text-xl`}>
                    {colors.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-primary mb-1">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                        {formatDate(event.date)}
                      </span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-slate-500 ml-13">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>{event.attendees} người</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Event Button */}
      <button className="w-full mt-4 py-2 text-sm text-brandBlue hover:bg-slate-50 rounded-lg transition-colors font-medium">
        + Thêm sự kiện
      </button>
    </div>
  );
}
