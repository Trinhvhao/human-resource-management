-- Advanced Performance Indexes for HR Management System
-- Created: 2026-01-27
-- Purpose: Optimize complex queries and improve dashboard performance

-- ============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- Attendance: Optimize date range queries with employee filter
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_date_status" 
ON "attendances"("employee_id", "date" DESC, "status");

-- Attendance: Optimize late/early leave queries
CREATE INDEX IF NOT EXISTS "idx_attendance_date_late" 
ON "attendances"("date" DESC, "is_late") WHERE "is_late" = true;

CREATE INDEX IF NOT EXISTS "idx_attendance_date_early" 
ON "attendances"("date" DESC, "is_early_leave") WHERE "is_early_leave" = true;

-- Leave Requests: Optimize dashboard queries (pending + date range)
CREATE INDEX IF NOT EXISTS "idx_leave_status_dates" 
ON "leave_requests"("status", "start_date" DESC, "end_date");

-- Leave Requests: Optimize employee leave history
CREATE INDEX IF NOT EXISTS "idx_leave_employee_status_date" 
ON "leave_requests"("employee_id", "status", "start_date" DESC);

-- Leave Requests: Optimize approver queries
CREATE INDEX IF NOT EXISTS "idx_leave_approver_status" 
ON "leave_requests"("approver_id", "status", "created_at" DESC);

-- Overtime: Optimize employee overtime history
CREATE INDEX IF NOT EXISTS "idx_overtime_employee_status_date" 
ON "overtime_requests"("employee_id", "status", "date" DESC);

-- Overtime: Optimize approver queries
CREATE INDEX IF NOT EXISTS "idx_overtime_approver_status" 
ON "overtime_requests"("approver_id", "status", "created_at" DESC);

-- Overtime: Optimize approved overtime calculations
CREATE INDEX IF NOT EXISTS "idx_overtime_status_date" 
ON "overtime_requests"("status", "date" DESC) WHERE "status" = 'APPROVED';

-- ============================================
-- CONTRACT MANAGEMENT INDEXES
-- ============================================

-- Contracts: Optimize expiring contracts queries
CREATE INDEX IF NOT EXISTS "idx_contract_status_enddate" 
ON "contracts"("status", "end_date" ASC) WHERE "status" = 'ACTIVE' AND "end_date" IS NOT NULL;

-- Contracts: Optimize employee contract lookup
CREATE INDEX IF NOT EXISTS "idx_contract_employee_status" 
ON "contracts"("employee_id", "status", "start_date" DESC);

-- ============================================
-- PAYROLL INDEXES
-- ============================================

-- Payroll Items: Optimize employee payroll history
CREATE INDEX IF NOT EXISTS "idx_payroll_item_employee" 
ON "payroll_items"("employee_id", "payroll_id");

-- Payroll: Optimize year-based queries
CREATE INDEX IF NOT EXISTS "idx_payroll_year_month_status" 
ON "payrolls"("year" DESC, "month" DESC, "status");

-- ============================================
-- REWARDS & DISCIPLINES INDEXES
-- ============================================

-- Rewards: Optimize employee rewards lookup
CREATE INDEX IF NOT EXISTS "idx_reward_employee_date" 
ON "rewards"("employee_id", "reward_date" DESC);

-- Rewards: Optimize type-based queries
CREATE INDEX IF NOT EXISTS "idx_reward_type_date" 
ON "rewards"("reward_type", "reward_date" DESC);

-- Disciplines: Optimize employee disciplines lookup
CREATE INDEX IF NOT EXISTS "idx_discipline_employee_date" 
ON "disciplines"("employee_id", "discipline_date" DESC);

-- Disciplines: Optimize type-based queries
CREATE INDEX IF NOT EXISTS "idx_discipline_type_date" 
ON "disciplines"("discipline_type", "discipline_date" DESC);

-- ============================================
-- EMPLOYEE MANAGEMENT INDEXES
-- ============================================

-- Employees: Optimize department + status queries
CREATE INDEX IF NOT EXISTS "idx_employee_dept_status" 
ON "employees"("department_id", "status", "start_date" DESC);

-- Employees: Optimize search by name (for autocomplete)
CREATE INDEX IF NOT EXISTS "idx_employee_fullname" 
ON "employees"("full_name" text_pattern_ops);

-- Employees: Optimize birthday queries
CREATE INDEX IF NOT EXISTS "idx_employee_dob_month_day" 
ON "employees"(EXTRACT(MONTH FROM "date_of_birth"), EXTRACT(DAY FROM "date_of_birth"));

-- ============================================
-- LEAVE BALANCE INDEXES
-- ============================================

-- Leave Balance: Optimize employee year lookup
CREATE INDEX IF NOT EXISTS "idx_leave_balance_employee_year" 
ON "leave_balances"("employee_id", "year" DESC);

-- Leave Balance: Optimize year-based queries
CREATE INDEX IF NOT EXISTS "idx_leave_balance_year" 
ON "leave_balances"("year" DESC);

-- ============================================
-- AUDIT & TRACKING INDEXES
-- ============================================

-- General: Optimize created_at queries for recent activities
CREATE INDEX IF NOT EXISTS "idx_leave_created" 
ON "leave_requests"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_overtime_created" 
ON "overtime_requests"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_employee_created" 
ON "employees"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_employee_updated" 
ON "employees"("updated_at" DESC);

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ============================================

-- Active employees only (most common query)
CREATE INDEX IF NOT EXISTS "idx_employee_active" 
ON "employees"("department_id", "start_date" DESC) WHERE "status" = 'ACTIVE';

-- Pending requests only (dashboard queries)
CREATE INDEX IF NOT EXISTS "idx_leave_pending" 
ON "leave_requests"("employee_id", "created_at" DESC) WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "idx_overtime_pending" 
ON "overtime_requests"("employee_id", "created_at" DESC) WHERE "status" = 'PENDING';

-- ============================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================

-- Attendance summary queries (avoid table lookups)
CREATE INDEX IF NOT EXISTS "idx_attendance_summary" 
ON "attendances"("date", "status", "is_late", "is_early_leave", "work_hours");

-- Employee list queries (avoid table lookups)
CREATE INDEX IF NOT EXISTS "idx_employee_list" 
ON "employees"("status", "department_id", "employee_code", "full_name", "email");

-- ============================================
-- STATISTICS & ANALYTICS
-- ============================================

-- Optimize COUNT queries
CREATE INDEX IF NOT EXISTS "idx_employee_status_count" 
ON "employees"("status") INCLUDE ("id");

CREATE INDEX IF NOT EXISTS "idx_attendance_date_count" 
ON "attendances"("date") INCLUDE ("id", "status");

-- ============================================
-- UPDATE STATISTICS
-- ============================================

-- Update statistics for query planner
ANALYZE "employees";
ANALYZE "attendances";
ANALYZE "leave_requests";
ANALYZE "overtime_requests";
ANALYZE "contracts";
ANALYZE "payrolls";
ANALYZE "payroll_items";
ANALYZE "rewards";
ANALYZE "disciplines";
ANALYZE "leave_balances";
