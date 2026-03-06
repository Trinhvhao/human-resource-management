'use client';

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Settings, LogOut, User, ChevronDown, LayoutGrid, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import NotificationBell from '@/components/notifications/NotificationBell';
import Avatar from '@/components/common/Avatar';

const roleLabels: Record<string, string> = {
  ADMIN: 'Quản trị viên',
  HR_MANAGER: 'Quản lý nhân sự',
  MANAGER: 'Trưởng phòng',
  EMPLOYEE: 'Nhân viên',
};

const pageInfo: Record<string, { title: string; subtitle: string; icon?: any }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Tổng quan hệ thống quản lý nhân sự',
    icon: LayoutGrid
  },
  '/dashboard/employees': { title: 'Quản lý Nhân viên', subtitle: 'Quản lý thông tin nhân viên' },
  '/dashboard/departments': { title: 'Quản lý Phòng ban', subtitle: 'Quản lý cơ cấu tổ chức' },
  '/dashboard/attendance': { title: 'Quản lý Chấm công', subtitle: 'Quản lý chấm công nhân viên' },
  '/dashboard/leaves': { title: 'Nghỉ phép', subtitle: 'Quản lý đơn nghỉ phép' },
  '/dashboard/my-leaves': { title: 'Nghỉ phép của tôi', subtitle: 'Xem và tạo đơn nghỉ phép' },
  '/dashboard/overtime': { title: 'Quản lý Tăng ca', subtitle: 'Quản lý đơn tăng ca' },
  '/dashboard/my-overtime': { title: 'Làm thêm giờ', subtitle: 'Xem và đăng ký tăng ca' },
  '/dashboard/payroll': { title: 'Quản lý Lương', subtitle: 'Quản lý bảng lương' },
  '/dashboard/my-attendance': { title: 'Chấm công của tôi', subtitle: 'Chấm công và xem lịch sử' },
  '/dashboard/face-recognition': { title: 'Nhận diện khuôn mặt', subtitle: 'Đăng ký và quản lý khuôn mặt' },
  '/dashboard/my-calendar': { title: 'Lịch của tôi', subtitle: 'Xem lịch làm việc và sự kiện' },
  '/dashboard/rewards': { title: 'Khen thưởng', subtitle: 'Quản lý khen thưởng' },
  '/dashboard/disciplines': { title: 'Kỷ luật', subtitle: 'Quản lý kỷ luật' },
  '/dashboard/settings': { title: 'Cài đặt', subtitle: 'Cấu hình hệ thống' },
  '/dashboard/profile': { title: 'Hồ sơ', subtitle: 'Thông tin cá nhân' },
};

const TopHeader = memo(function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current page info
  const currentPage = pageInfo[pathname] || { title: 'Dashboard', subtitle: '' };
  const PageIcon = currentPage.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const displayName = user?.employee?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page Title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-primary">{currentPage.title}</h1>
          {currentPage.subtitle && (
            <p className="text-xs text-slate-500">{currentPage.subtitle}</p>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={user?.role === 'EMPLOYEE' ? 'Tìm kiếm...' : 'Tìm kiếm nhân viên, phòng ban...'}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandBlue/20 focus:border-brandBlue text-sm"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Refresh Button (only on dashboard) */}
        {pathname === '/dashboard' && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
            title="Làm mới"
          >
            <RefreshCw size={18} className="text-brandBlue" />
          </button>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* Settings */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Settings size={20} className="text-slate-600" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200"></div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-primary">{displayName}</p>
              <p className="text-xs text-slate-500">{roleLabels[user?.role || 'EMPLOYEE']}</p>
            </div>
            <Avatar
              src={user?.employee?.avatarUrl}
              name={displayName}
              size="md"
              alt={displayName}
            />
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-primary">{displayName}</p>
                <p className="text-xs text-slate-500 mb-2">{user?.email}</p>
                {/* Role Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-semibold text-blue-700">
                    {roleLabels[user?.role || 'EMPLOYEE']}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push('/dashboard/profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <User size={16} />
                  Thông tin cá nhân
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push('/dashboard/payroll');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  Phiếu lương của tôi
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    router.push('/dashboard/settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                >
                  <Settings size={16} />
                  Cài đặt
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});

export default TopHeader;
