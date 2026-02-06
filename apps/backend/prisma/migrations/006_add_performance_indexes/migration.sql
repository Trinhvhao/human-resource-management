-- =====================================================
-- PERFORMANCE INDEXES FOR DASHBOARD
-- Created: 2026-02-05
-- Purpose: Optimize dashboard queries and improve load time
-- Expected improvement: 10-15x faster queries
-- =====================================================

-- =====================================================
-- EMPLOYEES TABLE INDEXES
-- =====================================================

-- Status queries (most common filter: WHERE status = 'ACTIVE')
CREATE INDEX IF NOT EXISTS idx_employees_status 
ON employees(status);

-- Department joins (JOIN departments ON employees.department_id = departments.id)
CREATE INDEX IF NOT EXISTS idx_employees_department_id 
ON employees(department_id);

-- Turnover calculation (WHERE status = 'INACTIVE' AND updated_at BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_employees_status_updated 
ON employees(status, updated_at);

-- Position grouping (GROUP BY position)
CREATE INDEX IF NOT EXISTS idx_employees_position 
ON employees(position);

-- =====================================================
-- ATTENDANCES TABLE INDEXES
-- =====================================================

-- Late tracking (WHERE date = X AND is_late = true)
CREATE INDEX IF NOT EXISTS idx_attendances_date_late 
ON attendances(date, is_late);

-- Composite for employee stats (WHERE employee_id = X AND date BETWEEN ... AND status = Y)
CREATE INDEX IF NOT EXISTS idx_attendances_emp_date_status 
ON attendances(employee_id, date, status);

-- Early leave tracking
CREATE INDEX IF NOT EXISTS idx_attendances_date_early_leave 
ON attendances(date, is_early_leave);

-- =====================================================
-- LEAVE_REQUESTS TABLE INDEXES
-- =====================================================

-- Status filter (WHERE status = 'PENDING')
CREATE INDEX IF NOT EXISTS idx_leave_requests_status 
ON leave_requests(status);

-- Status + created for sorting (WHERE status = X ORDER BY created_at)
CREATE INDEX IF NOT EXISTS idx_leave_requests_status_created 
ON leave_requests(status, created_at);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id 
ON leave_requests(employee_id);

-- Date range queries (WHERE start_date BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates 
ON leave_requests(start_date, end_date);

-- =====================================================
-- CONTRACTS TABLE INDEXES
-- =====================================================

-- Expiring contracts query (WHERE status = 'ACTIVE' AND end_date BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_contracts_status_enddate 
ON contracts(status, end_date);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id 
ON contracts(employee_id);

-- =====================================================
-- REWARDS TABLE INDEXES
-- =====================================================

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_rewards_employee_id 
ON rewards(employee_id);

-- Employee + date for performance calculation (WHERE employee_id = X AND created_at >= Y)
CREATE INDEX IF NOT EXISTS idx_rewards_employee_created 
ON rewards(employee_id, created_at);

-- Reward date queries
CREATE INDEX IF NOT EXISTS idx_rewards_reward_date 
ON rewards(reward_date);

-- =====================================================
-- OVERTIME_REQUESTS TABLE INDEXES
-- =====================================================

-- Status filter (WHERE status = 'PENDING')
CREATE INDEX IF NOT EXISTS idx_overtime_status 
ON overtime_requests(status);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_overtime_employee_id 
ON overtime_requests(employee_id);

-- Date range queries (WHERE date BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_overtime_date 
ON overtime_requests(date);

-- Status + created for sorting
CREATE INDEX IF NOT EXISTS idx_overtime_status_created 
ON overtime_requests(status, created_at);

-- =====================================================
-- DEPARTMENTS TABLE INDEXES
-- =====================================================

-- Active filter (WHERE is_active = true)
CREATE INDEX IF NOT EXISTS idx_departments_active 
ON departments(is_active);

-- Parent hierarchy (WHERE parent_id = X)
CREATE INDEX IF NOT EXISTS idx_departments_parent_id 
ON departments(parent_id);

-- Manager lookup (WHERE manager_id = X)
CREATE INDEX IF NOT EXISTS idx_departments_manager_id 
ON departments(manager_id);

-- =====================================================
-- PAYROLLS TABLE INDEXES
-- =====================================================

-- Status filter (WHERE status = 'FINALIZED')
CREATE INDEX IF NOT EXISTS idx_payrolls_status 
ON payrolls(status);

-- Year queries (WHERE year = X)
CREATE INDEX IF NOT EXISTS idx_payrolls_year 
ON payrolls(year);

-- =====================================================
-- PAYROLL_ITEMS TABLE INDEXES
-- =====================================================

-- Payroll lookup (WHERE payroll_id = X)
CREATE INDEX IF NOT EXISTS idx_payroll_items_payroll_id 
ON payroll_items(payroll_id);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee_id 
ON payroll_items(employee_id);

-- =====================================================
-- DISCIPLINES TABLE INDEXES
-- =====================================================

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_disciplines_employee_id 
ON disciplines(employee_id);

-- Date queries (WHERE discipline_date BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_disciplines_date 
ON disciplines(discipline_date);

-- =====================================================
-- ATTENDANCE_CORRECTIONS TABLE INDEXES
-- =====================================================

-- Status filter (WHERE status = 'PENDING')
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status 
ON attendance_corrections(status);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_employee_id 
ON attendance_corrections(employee_id);

-- Date queries (WHERE date BETWEEN ...)
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_date 
ON attendance_corrections(date);

-- =====================================================
-- LEAVE_BALANCES TABLE INDEXES
-- =====================================================

-- Year queries (WHERE year = X)
CREATE INDEX IF NOT EXISTS idx_leave_balances_year 
ON leave_balances(year);

-- =====================================================
-- TEAMS TABLE INDEXES
-- =====================================================

-- Department lookup (WHERE department_id = X)
CREATE INDEX IF NOT EXISTS idx_teams_department_id 
ON teams(department_id);

-- Active filter (WHERE is_active = true)
CREATE INDEX IF NOT EXISTS idx_teams_active 
ON teams(is_active);

-- Team lead lookup (WHERE team_lead_id = X)
CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id 
ON teams(team_lead_id);

-- =====================================================
-- TEAM_MEMBERS TABLE INDEXES
-- =====================================================

-- Team lookup (WHERE team_id = X)
CREATE INDEX IF NOT EXISTS idx_team_members_team_id 
ON team_members(team_id);

-- Employee lookup (WHERE employee_id = X)
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id 
ON team_members(employee_id);

-- Active filter (WHERE is_active = true)
CREATE INDEX IF NOT EXISTS idx_team_members_active 
ON team_members(is_active);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- To verify indexes were created, run:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('employees', 'attendances', 'leave_requests', 'contracts', 'rewards', 'overtime_requests');

-- To check index usage after deployment:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;
