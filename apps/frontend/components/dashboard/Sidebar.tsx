'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  FileText, 
  DollarSign, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Nhân viên', href: '/dashboard/employees' },
  { icon: Building2, label: 'Phòng ban', href: '/dashboard/departments' },
  { icon: Clock, label: 'Chấm công', href: '/dashboard/attendance' },
  { icon: Calendar, label: 'Nghỉ phép', href: '/dashboard/leaves' },
  { icon: FileText, label: 'Làm thêm giờ', href: '/dashboard/overtime' },
  { icon: DollarSign, label: 'Lương', href: '/dashboard/payroll' },
  { icon: Settings, label: 'Cài đặt', href: '/dashboard/settings' },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 80 }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
        {isOpen ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-secondary to-brandRed rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-primary">
              <span className="text-secondary">HRMS</span> Pro
            </span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-brandRed rounded-lg flex items-center justify-center mx-auto">
            <Clock className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-brandBlue text-white shadow-lg shadow-brandBlue/20' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                    ${!isOpen && 'justify-center'}
                  `}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {isOpen && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {isOpen && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brandBlue text-white flex items-center justify-center font-bold">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">Admin User</p>
              <p className="text-xs text-slate-500 truncate">admin@company.vn</p>
            </div>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
