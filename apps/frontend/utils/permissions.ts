import { UserRole } from '@/types/auth';

// Permission levels
export const PERMISSIONS = {
  // Employee management
  VIEW_EMPLOYEES: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  CREATE_EMPLOYEE: ['ADMIN', 'HR_MANAGER'],
  EDIT_EMPLOYEE: ['ADMIN', 'HR_MANAGER'],
  DELETE_EMPLOYEE: ['ADMIN', 'HR_MANAGER'],
  
  // Department management
  VIEW_DEPARTMENTS: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  MANAGE_DEPARTMENTS: ['ADMIN', 'HR_MANAGER'],
  
  // Attendance
  VIEW_ALL_ATTENDANCE: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  VIEW_OWN_ATTENDANCE: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  APPROVE_ATTENDANCE_CORRECTION: ['ADMIN', 'HR_MANAGER'],
  
  // Leave requests
  VIEW_ALL_LEAVES: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  VIEW_OWN_LEAVES: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  CREATE_LEAVE: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  APPROVE_LEAVE: ['ADMIN', 'HR_MANAGER'],
  
  // Overtime
  VIEW_ALL_OVERTIME: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  VIEW_OWN_OVERTIME: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  CREATE_OVERTIME: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  APPROVE_OVERTIME: ['ADMIN', 'HR_MANAGER'],
  
  // Payroll
  VIEW_ALL_PAYROLL: ['ADMIN', 'HR_MANAGER'],
  VIEW_OWN_PAYSLIP: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  MANAGE_PAYROLL: ['ADMIN', 'HR_MANAGER'],
  
  // Contracts
  VIEW_CONTRACTS: ['ADMIN', 'HR_MANAGER'],
  MANAGE_CONTRACTS: ['ADMIN', 'HR_MANAGER'],
  
  // Rewards & Disciplines
  VIEW_REWARDS_DISCIPLINES: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  MANAGE_REWARDS_DISCIPLINES: ['ADMIN', 'HR_MANAGER'],
  
  // Salary components
  MANAGE_SALARY_COMPONENTS: ['ADMIN', 'HR_MANAGER'],
  
  // Holidays
  VIEW_HOLIDAYS: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  MANAGE_HOLIDAYS: ['ADMIN', 'HR_MANAGER'],
  
  // Reports & Export
  VIEW_REPORTS: ['ADMIN', 'HR_MANAGER', 'MANAGER'],
  EXPORT_DATA: ['ADMIN', 'HR_MANAGER'],
  
  // User management
  CREATE_USER: ['ADMIN', 'HR_MANAGER'],
  MANAGE_USERS: ['ADMIN'],
  
  // Dashboard
  VIEW_DASHBOARD: ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'],
  VIEW_ADMIN_DASHBOARD: ['ADMIN', 'HR_MANAGER'],
} as const;

// Check if user has permission
export const hasPermission = (userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean => {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(userRole);
};

// Check if user has any of the permissions
export const hasAnyPermission = (userRole: UserRole, permissions: Array<keyof typeof PERMISSIONS>): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all permissions
export const hasAllPermissions = (userRole: UserRole, permissions: Array<keyof typeof PERMISSIONS>): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Role hierarchy
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 4,
  HR_MANAGER: 3,
  MANAGER: 2,
  EMPLOYEE: 1,
};

// Check if user role is higher than or equal to required role
export const hasRoleLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Check if user is admin
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'ADMIN';
};

// Check if user is HR Manager
export const isHRManager = (userRole: UserRole): boolean => {
  return userRole === 'HR_MANAGER';
};

// Check if user is Manager
export const isManager = (userRole: UserRole): boolean => {
  return userRole === 'MANAGER';
};

// Check if user is Employee
export const isEmployee = (userRole: UserRole): boolean => {
  return userRole === 'EMPLOYEE';
};

// Check if user can view employee data
export const canViewEmployee = (userRole: UserRole, targetEmployeeId: string, currentEmployeeId?: string): boolean => {
  // Admin and HR can view all
  if (hasPermission(userRole, 'VIEW_EMPLOYEES')) {
    return true;
  }
  
  // Employee can only view their own data
  return targetEmployeeId === currentEmployeeId;
};

// Check if user can edit employee data
export const canEditEmployee = (userRole: UserRole, targetEmployeeId: string, currentEmployeeId?: string): boolean => {
  // Admin and HR can edit all
  if (hasPermission(userRole, 'EDIT_EMPLOYEE')) {
    return true;
  }
  
  return false;
};

// Check if user can approve requests
export const canApproveRequest = (userRole: UserRole): boolean => {
  return hasPermission(userRole, 'APPROVE_LEAVE') || hasPermission(userRole, 'APPROVE_OVERTIME');
};

// Get accessible routes based on role
export const getAccessibleRoutes = (userRole: UserRole): string[] => {
  const routes: string[] = ['/dashboard'];
  
  if (hasPermission(userRole, 'VIEW_EMPLOYEES')) {
    routes.push('/dashboard/employees');
  }
  
  if (hasPermission(userRole, 'VIEW_DEPARTMENTS')) {
    routes.push('/dashboard/departments');
  }
  
  if (hasPermission(userRole, 'VIEW_ALL_ATTENDANCE')) {
    routes.push('/dashboard/attendance');
  }
  
  if (hasPermission(userRole, 'VIEW_ALL_LEAVES')) {
    routes.push('/dashboard/leaves');
  }
  
  if (hasPermission(userRole, 'VIEW_ALL_OVERTIME')) {
    routes.push('/dashboard/overtime');
  }
  
  if (hasPermission(userRole, 'VIEW_ALL_PAYROLL')) {
    routes.push('/dashboard/payroll');
  }
  
  if (hasPermission(userRole, 'VIEW_CONTRACTS')) {
    routes.push('/dashboard/contracts');
  }
  
  if (hasPermission(userRole, 'VIEW_REPORTS')) {
    routes.push('/dashboard/reports');
  }
  
  routes.push('/dashboard/profile');
  
  return routes;
};
