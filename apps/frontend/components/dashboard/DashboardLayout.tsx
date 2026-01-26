'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { useAuthStore } from '@/store/authStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load user on mount
  useEffect(() => {
    setMounted(true);
    loadUser();
  }, [loadUser]);

  // Redirect if not authenticated (after mount to avoid hydration mismatch)
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [mounted, isAuthenticated, isLoading, router]);

  // Show loading state
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-offWhite flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brandBlue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-offWhite flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <TopHeader />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
