-- Migration: Add Performance Indexes
-- Description: Add critical indexes to improve query performance
-- Note: Using snake_case column names as per database schema

-- =====================================================
-- ATTENDANCE INDEXES
-- =====================================================

-- Composite index for date range queries by employee
CREATE INDEX IF NOT EXISTS idx_attendances_employee_date 
ON attendances(employee_id, date DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_attendances_status 
ON attendances(status) WHERE status IS NOT NULL;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_attendances_date 
ON attendances(date DESC);

-- =====================================================
-- CONTRACT INDEXES
-- =====================================================

-- Composite index for active contracts expiring soon
CREATE INDEX IF NOT EXISTS idx_contracts_status_end_date 
ON contracts(status, end_date) 
WHERE status = 'ACTIVE';

-- Index for employee contracts
CREATE INDEX IF NOT EXISTS idx_contracts_employee 
ON contracts(employee_id, start_date DESC);

-- =====================================================
-- LEAVE REQUEST INDEXES
-- =====================================================

-- Composite index for leave requests by status and date
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates 
ON leave_requests(status, start_date, end_date);

-- Index for employee leave requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee 
ON leave_requests(employee_id, start_date DESC);

-- Index for pending approvals
CREATE INDEX IF NOT EXISTS idx_leave_requests_pending 
ON leave_requests(status, created_at DESC) 
WHERE status = 'PENDING';

-- =====================================================
-- OVERTIME REQUEST INDEXES
-- =====================================================

-- Index for overtime by status
CREATE INDEX IF NOT EXISTS idx_overtime_requests_status 
ON overtime_requests(status, date DESC);

-- Index for employee overtime
CREATE INDEX IF NOT EXISTS idx_overtime_requests_employee 
ON overtime_requests(employee_id, date DESC);

-- =====================================================
-- PAYROLL INDEXES
-- =====================================================

-- Composite index for payroll by month/year
CREATE INDEX IF NOT EXISTS idx_payrolls_month_year 
ON payrolls(year DESC, month DESC);

-- Index for employee payroll history (via payroll_items)
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee 
ON payroll_items(employee_id, payroll_id);

-- Index for payroll status
CREATE INDEX IF NOT EXISTS idx_payrolls_status 
ON payrolls(status, year DESC, month DESC);

-- =====================================================
-- EMPLOYEE INDEXES
-- =====================================================

-- Full-text search index for employees
CREATE INDEX IF NOT EXISTS idx_employees_search 
ON employees USING GIN (
  to_tsvector('english', 
    COALESCE(full_name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(employee_code, '')
  )
);

-- Index for active employees by department
CREATE INDEX IF NOT EXISTS idx_employees_dept_status 
ON employees(department_id, status) 
WHERE status = 'ACTIVE';

-- =====================================================
-- NOTIFICATION INDEXES
-- =====================================================

-- Index for unread notifications count (optimized)
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- =====================================================
-- SALARY COMPONENT INDEXES
-- =====================================================

-- Index for salary components by employee
CREATE INDEX IF NOT EXISTS idx_salary_components_employee 
ON salary_components(employee_id, effective_date DESC);

-- Index for active salary components
CREATE INDEX IF NOT EXISTS idx_salary_components_active 
ON salary_components(employee_id, is_active) 
WHERE is_active = true;

-- =====================================================
-- DEPARTMENT INDEXES
-- =====================================================

-- Index for department hierarchy queries
CREATE INDEX IF NOT EXISTS idx_departments_parent 
ON departments(parent_id) 
WHERE parent_id IS NOT NULL;

-- Index for active departments
CREATE INDEX IF NOT EXISTS idx_departments_active 
ON departments(is_active) 
WHERE is_active = true;

-- =====================================================
-- EMPLOYEE ACTIVITY INDEXES
-- =====================================================

-- Index for recent activities by employee
CREATE INDEX IF NOT EXISTS idx_employee_activities_employee_date 
ON employee_activities(employee_id, created_at DESC);

-- Index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_employee_activities_type 
ON employee_activities(activity_type, created_at DESC);

-- =====================================================
-- REWARDS & DISCIPLINES INDEXES
-- =====================================================

-- Index for rewards by employee
CREATE INDEX IF NOT EXISTS idx_rewards_employee 
ON rewards(employee_id, reward_date DESC);

-- Index for disciplines by employee
CREATE INDEX IF NOT EXISTS idx_disciplines_employee 
ON disciplines(employee_id, discipline_date DESC);

-- =====================================================
-- ANALYZE TABLES
-- =====================================================

-- Update statistics for query planner
ANALYZE attendances;
ANALYZE contracts;
ANALYZE leave_requests;
ANALYZE overtime_requests;
ANALYZE payrolls;
ANALYZE payroll_items;
ANALYZE employees;
ANALYZE notifications;
ANALYZE salary_components;
ANALYZE departments;
ANALYZE employee_activities;
ANALYZE rewards;
ANALYZE disciplines;

-- Add comments
COMMENT ON INDEX idx_attendances_employee_date IS 'Optimize attendance queries by employee and date range';
COMMENT ON INDEX idx_contracts_status_end_date IS 'Optimize contract expiration queries';
COMMENT ON INDEX idx_leave_requests_status_dates IS 'Optimize leave request filtering and date range queries';
COMMENT ON INDEX idx_payrolls_month_year IS 'Optimize payroll queries by period';
COMMENT ON INDEX idx_employees_search IS 'Full-text search for employees';
COMMENT ON INDEX idx_notifications_unread IS 'Optimize unread notification count queries';
