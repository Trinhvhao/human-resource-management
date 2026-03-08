'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  DollarSign,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Award,
  ScanFace
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  icon: any;
  label: string;
  href?: string;
  roles: string[];
  children?: SubMenuItem[];
}

interface SubMenuItem {
  label: string;
  href: string;
}

const adminMenuItems: MenuItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['ADMIN', 'MANAGER']
  },
  {
    icon: Users,
    label: 'Nhân viên',
    href: '/dashboard/employees',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Danh sách', href: '/dashboard/employees' },
      { label: 'Thêm mới', href: '/dashboard/employees/new' },
    ]
  },
  {
    icon: Building2,
    label: 'Phòng ban',
    href: '/dashboard/departments',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Danh sách', href: '/dashboard/departments' },
      { label: 'Cây tổ chức', href: '/dashboard/departments/tree' },
      { label: 'Yêu cầu thay đổi', href: '/dashboard/departments/change-requests' },
    ]
  },
  {
    icon: FileSignature,
    label: 'Hợp đồng',
    href: '/dashboard/contracts',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Danh sách', href: '/dashboard/contracts' },
      { label: 'Tạo mới', href: '/dashboard/contracts/new' },
      { label: 'Chấm dứt HĐ', href: '/dashboard/contracts/terminations' },
    ]
  },
  {
    icon: Clock,
    label: 'Chấm công',
    href: '/dashboard/attendance',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Tổng quan', href: '/dashboard/attendance' },
      { label: 'Lịch sử', href: '/dashboard/attendance/history' },
      { label: 'Báo cáo', href: '/dashboard/attendance/reports' },
      { label: 'Quản lý', href: '/dashboard/attendance/management' },
      { label: 'Nhận diện khuôn mặt', href: '/dashboard/attendance/face-management' },
    ]
  },
  {
    icon: CalendarDays,
    label: 'Lịch làm việc',
    href: '/dashboard/schedules',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Lịch tổng quan', href: '/dashboard/schedules/overview' },
      { label: 'Ca làm việc', href: '/dashboard/schedules/shifts' },
    ]
  },
  {
    icon: Calendar,
    label: 'Nghỉ phép',
    href: '/dashboard/leaves',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Yêu cầu', href: '/dashboard/leaves' },
      { label: 'Số dư phép', href: '/dashboard/leaves/balances' },
    ]
  },
  {
    icon: FileText,
    label: 'Làm thêm giờ',
    href: '/dashboard/overtime',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Danh sách', href: '/dashboard/overtime' },
      { label: 'Đăng ký mới', href: '/dashboard/overtime/new' },
    ]
  },
  {
    icon: Award,
    label: 'Thưởng & Phạt',
    href: '/dashboard/rewards-disciplines',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Tổng quan', href: '/dashboard/rewards-disciplines' },
      { label: 'Khen thưởng', href: '/dashboard/rewards' },
      { label: 'Kỷ luật', href: '/dashboard/disciplines' },
    ]
  },
  {
    icon: DollarSign,
    label: 'Quản lý lương',
    href: '/dashboard/payroll',
    roles: ['ADMIN', 'MANAGER'],
    children: [
      { label: 'Bảng lương', href: '/dashboard/payroll/manage' },
      { label: 'Phê duyệt', href: '/dashboard/payroll/approvals' },
      { label: 'Cấu trúc lương', href: '/dashboard/payroll/salary-structure' },
    ]
  },
  {
    icon: Settings,
    label: 'Cài đặt',
    href: '/dashboard/settings',
    roles: ['ADMIN', 'HR_MANAGER', 'MANAGER']
  },
];

const employeeMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Trang chủ', href: '/dashboard', roles: ['EMPLOYEE'] },
  { icon: ClipboardCheck, label: 'Chấm công', href: '/dashboard/my-attendance', roles: ['EMPLOYEE'] },
  { icon: ScanFace, label: 'Nhận diện khuôn mặt', href: '/dashboard/face-recognition', roles: ['EMPLOYEE'] },
  { icon: CalendarDays, label: 'Lịch của tôi', href: '/dashboard/my-calendar', roles: ['EMPLOYEE'] },
  { icon: Calendar, label: 'Nghỉ phép', href: '/dashboard/my-leaves', roles: ['EMPLOYEE'] },
  { icon: FileText, label: 'Làm thêm giờ', href: '/dashboard/my-overtime', roles: ['EMPLOYEE'] },
  { icon: DollarSign, label: 'Lương của tôi', href: '/dashboard/payroll', roles: ['EMPLOYEE'] },
  { icon: Settings, label: 'Cài đặt', href: '/dashboard/settings', roles: ['EMPLOYEE'] },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Select menu items based on user role
  const menuItems = user?.role === 'EMPLOYEE' ? employeeMenuItems : adminMenuItems;

  // Check if a menu item or its children are active
  const isItemActive = (item: MenuItem): boolean => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some(child => pathname.startsWith(child.href));
    }
    return false;
  };

  // Check if a submenu item is active
  const isSubItemActive = (href: string): boolean => {
    // Exact match first
    if (pathname === href) return true;

    // For dynamic routes, check carefully to avoid false positives
    if (href === '/dashboard/departments' && pathname.startsWith('/dashboard/departments/')) {
      // Don't match if it's a specific submenu route
      if (pathname.startsWith('/dashboard/departments/tree')) return false;
      if (pathname.startsWith('/dashboard/departments/change-requests')) return false;
      if (pathname.startsWith('/dashboard/departments/new')) return false;
      // Match for /dashboard/departments/[id] (detail/edit pages)
      return true;
    }

    // For contracts, be more specific
    if (href === '/dashboard/contracts' && pathname.startsWith('/dashboard/contracts/')) {
      // Don't match if it's a specific submenu route
      if (pathname.startsWith('/dashboard/contracts/new')) return false;
      if (pathname.startsWith('/dashboard/contracts/terminations')) return false;
      // Match for /dashboard/contracts/[id] (detail/edit pages)
      return true;
    }

    // For employees, be more specific
    if (href === '/dashboard/employees' && pathname.startsWith('/dashboard/employees/')) {
      // Don't match if it's the new page
      if (pathname.startsWith('/dashboard/employees/new')) return false;
      // Match for /dashboard/employees/[id] (detail/edit pages)
      return true;
    }

    // For other routes, exact match only
    return false;
  };

  // Toggle dropdown
  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  // Auto-expand active parent on mount
  useState(() => {
    menuItems.forEach(item => {
      if (item.children && isItemActive(item)) {
        setExpandedItems(prev => [...prev, item.label]);
      }
    });
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col shadow-lg"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-r from-secondary via-orange-600 to-orange-700 rounded-lg flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-primary">
              <span className="text-secondary">HRMS</span> Pro
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-linear-to-r from-secondary via-orange-600 to-orange-700 rounded-lg flex items-center justify-center mx-auto shadow-lg">
            <Clock className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-all shadow-md hover:shadow-lg"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item);
            const isExpanded = expandedItems.includes(item.label);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <li key={item.label}>
                {/* Parent Item */}
                {hasChildren ? (
                  <button
                    onClick={() => {
                      if (isOpen) {
                        toggleExpand(item.label);
                      } else {
                        onToggle();
                        setTimeout(() => toggleExpand(item.label), 100);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                      ${isActive
                        ? 'bg-linear-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                  >
                    <Icon size={20} className="shrink-0" />
                    {isOpen && (
                      <>
                        <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                      ${isActive
                        ? 'bg-linear-to-r from-brandBlue via-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-slate-50'
                      }
                      ${!isOpen && 'justify-center'}
                    `}
                  >
                    <Icon size={20} className="shrink-0" />
                    {isOpen && (
                      <span className="font-semibold text-sm">{item.label}</span>
                    )}
                  </Link>
                )}

                {/* Submenu Items */}
                {hasChildren && isOpen && (
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1 ml-9 space-y-1 overflow-hidden"
                      >
                        {item.children!.map((child) => {
                          const isChildActive = isSubItemActive(child.href);
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`
                                  block px-3 py-2 rounded-lg text-sm transition-all
                                  ${isChildActive
                                    ? 'bg-blue-50 text-brandBlue font-bold border-l-2 border-brandBlue'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-brandBlue'
                                  }
                                `}
                              >
                                {child.label}
                              </Link>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {isOpen && user && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-r from-brandBlue via-blue-600 to-blue-700 text-white flex items-center justify-center font-bold shadow-lg">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary truncate">{user.email}</p>
              <p className="text-xs text-slate-500 truncate font-medium">
                {user.role === 'ADMIN' ? 'Quản trị viên' :
                  user.role === 'HR_MANAGER' ? 'Nhân sự' :
                    user.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
