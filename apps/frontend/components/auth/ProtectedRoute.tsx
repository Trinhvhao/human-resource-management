'use client';

import { redirect } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: keyof typeof PERMISSIONS;
    requiredRoles?: UserRole[];
}

export default function ProtectedRoute({
    children,
    requiredPermission,
    requiredRoles,
}: ProtectedRouteProps) {
    const { user, isAuthenticated } = useAuthStore();

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        redirect('/login');
    }

    // Check permission-based access
    if (requiredPermission && user && !hasPermission(user.role, requiredPermission)) {
        redirect('/403');
    }

    // Check role-based access
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        redirect('/403');
    }

    return <>{children}</>;
}
