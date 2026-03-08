'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import notificationService from '@/services/notificationService';
import { Notification } from '@/types/notification';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const router = useRouter();

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getAll(filter === 'unread');
            if (response?.data && Array.isArray(response.data)) {
                setNotifications(response.data);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationService.delete(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('Bạn có chắc muốn xóa tất cả thông báo?')) return;
        try {
            await notificationService.deleteAll();
            setNotifications([]);
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getNotificationIcon = (type: string) => {
        const iconClass = 'w-12 h-12 rounded-full flex items-center justify-center text-xl';
        switch (type) {
            case 'SUCCESS':
            case 'LEAVE_APPROVED':
            case 'OVERTIME_APPROVED':
            case 'REWARD_RECEIVED':
                return <div className={`${iconClass} bg-green-100 text-green-600`}>✓</div>;
            case 'ERROR':
            case 'LEAVE_REJECTED':
            case 'OVERTIME_REJECTED':
            case 'DISCIPLINE_ISSUED':
                return <div className={`${iconClass} bg-red-100 text-red-600`}>✕</div>;
            case 'WARNING':
            case 'CONTRACT_EXPIRING':
                return <div className={`${iconClass} bg-yellow-100 text-yellow-600`}>⚠</div>;
            case 'PAYROLL_GENERATED':
                return <div className={`${iconClass} bg-blue-100 text-blue-600`}>💰</div>;
            default:
                return <div className={`${iconClass} bg-gray-100 text-gray-600`}>ℹ</div>;
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Thông báo</h1>
                        <p className="text-slate-500 mt-1">
                            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã đọc'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-brandBlue text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <CheckCheck size={18} />
                                Đọc tất cả
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                <Trash2 size={18} />
                                Xóa tất cả
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                        <Filter size={20} className="text-slate-500" />
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                                ? 'bg-brandBlue text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Tất cả ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                                ? 'bg-brandBlue text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Chưa đọc ({unreadCount})
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-slate-500 mt-4">Đang tải thông báo...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell size={64} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">Không có thông báo</h3>
                            <p className="text-slate-500">
                                {filter === 'unread'
                                    ? 'Bạn đã đọc hết tất cả thông báo'
                                    : 'Chưa có thông báo nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-6 hover:bg-slate-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {getNotificationIcon(notification.type)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3
                                                            className={`text-lg font-semibold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'
                                                                }`}
                                                        >
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-brandBlue rounded-full"></div>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-600 mt-1">{notification.message}</p>
                                                    <span className="text-sm text-slate-400 mt-2 inline-block">
                                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                                            addSuffix: true,
                                                            locale: vi,
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-brandBlue transition-colors"
                                                            title="Đánh dấu đã đọc"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(notification.id);
                                                        }}
                                                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
