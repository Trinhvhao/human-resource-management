-- =====================================================
-- DASHBOARD PERFORMANCE VIEWS
-- Created: 2026-02-05
-- Purpose: Eliminate N+1 queries and improve dashboard performance
-- =====================================================

-- =====================================================
-- VIEW 1: EMPLOYEE STATS SUMMARY
-- Aggregates employee counts by status, department, gender
-- =====================================================

CREATE OR REPLACE VIEW vw_employee_stats AS
SELECT
  COUNT(*) as total_employees,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_employees,
  COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive_employees,
  COUNT(*) FILTER (WHERE status = 'ON_LEAVE') as on_leave_employees,
  COUNT(DISTINCT department_id) as total_departments
FROM employees;

-- =====================================================
-- VIEW 2: ATTENDANCE SUMMARY BY MONTH
-- Pre-aggregated attendance stats for faster queries
-- =====================================================

CREATE OR REPLACE VIEW vw_attendance_monthly_summary AS
SELECT
  DATE_TRUNC('month', date) as month,
  EXTRACT(YEAR FROM date) as year,
  EXTRACT(MONTH FROM date) as month_num,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'PRESENT') as present_count,
  COUNT(*) FILTER (WHERE is_late = true) as late_count,
  COUNT(*) FILTER (WHERE is_early_leave = true) as early_leave_count,
  ROUND(AVG(work_hours), 2) as avg_work_hours,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'PRESENT')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as attendance_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE is_late = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) as late_rate
FROM attendances
GROUP BY DATE_TRUNC('month', date), EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date);

-- =====================================================
-- VIEW 3: PENDING APPROVALS SUMMARY
-- Quick counts of pending items
-- =====================================================

CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING') as pending_leaves,
  (SELECT COUNT(*) FROM overtime_requests WHERE status = 'PENDING') as pending_overtime,
  (SELECT COUNT(*) FROM attendance_corrections WHERE status = 'PENDING') as pending_corrections,
  (
    (SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING') +
    (SELECT COUNT(*) FROM overtime_requests WHERE status = 'PENDING') +
    (SELECT COUNT(*) FROM attendance_corrections WHERE status = 'PENDING')
  ) as total_pending;

-- =====================================================
-- VIEW 4: EXPIRING CONTRACTS
-- Contracts expiring in next 30 days
-- =====================================================

CREATE OR REPLACE VIEW vw_expiring_contracts AS
SELECT
  c.id as contract_id,
  c.employee_id,
  e.employee_code,
  e.full_name,
  c.end_date,
  EXTRACT(DAY FROM (c.end_date - CURRENT_DATE)) as days_remaining,
  d.name as department_name
FROM contracts c
JOIN employees e ON c.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE c.status = 'ACTIVE'
  AND c.end_date >= CURRENT_DATE
  AND c.end_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.end_date ASC;

-- =====================================================
-- VIEW 5: TODAY SNAPSHOT
-- Real-time dashboard snapshot
-- =====================================================

CREATE OR REPLACE VIEW vw_today_snapshot AS
SELECT
  (
    SELECT COUNT(*)
    FROM attendances
    WHERE date = CURRENT_DATE
      AND check_in IS NOT NULL
      AND check_out IS NULL
      AND status != 'ABSENT'
  ) as working_now,
  (
    SELECT COUNT(*)
    FROM attendances
    WHERE date = CURRENT_DATE
      AND is_late = true
  ) as late_today,
  (
    SELECT COUNT(*)
    FROM leave_requests
    WHERE status = 'PENDING'
  ) as pending_leaves,
  (
    SELECT COUNT(*)
    FROM overtime_requests
    WHERE status = 'PENDING'
  ) as pending_overtime,
  (
    SELECT COUNT(*)
    FROM contracts
    WHERE status = 'ACTIVE'
      AND end_date >= CURRENT_DATE
      AND end_date <= CURRENT_DATE + INTERVAL '7 days'
  ) as expiring_contracts_7days;

-- =====================================================
-- VIEW 6: EMPLOYEE TURNOVER BY MONTH
-- Pre-calculated turnover stats for last 12 months
-- =====================================================

CREATE OR REPLACE VIEW vw_employee_turnover_monthly AS
WITH monthly_data AS (
  SELECT
    DATE_TRUNC('month', updated_at) as month,
    EXTRACT(YEAR FROM updated_at) as year,
    EXTRACT(MONTH FROM updated_at) as month_num,
    COUNT(*) FILTER (WHERE status = 'INACTIVE') as terminations,
    (
      SELECT COUNT(*)
      FROM employees
      WHERE created_at <= DATE_TRUNC('month', e.updated_at) + INTERVAL '1 month' - INTERVAL '1 day'
    ) as total_employees_at_month_end
  FROM employees e
  WHERE updated_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', updated_at), EXTRACT(YEAR FROM updated_at), EXTRACT(MONTH FROM updated_at)
)
SELECT
  month,
  year,
  month_num,
  terminations,
  total_employees_at_month_end,
  CASE
    WHEN total_employees_at_month_end > 0
    THEN ROUND((terminations::DECIMAL / total_employees_at_month_end) * 100, 1)
    ELSE 0
  END as turnover_rate
FROM monthly_data
ORDER BY month DESC;

-- =====================================================
-- VIEW 7: DEPARTMENT PERFORMANCE STATS
-- Aggregated department metrics
-- =====================================================

CREATE OR REPLACE VIEW vw_department_performance AS
SELECT
  d.id as department_id,
  d.name as department_name,
  d.code as department_code,
  COUNT(DISTINCT e.id) as employee_count,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'ACTIVE') as active_employees,
  -- Attendance stats (last 30 days)
  COALESCE(
    ROUND(
      (COUNT(a.id) FILTER (WHERE a.status = 'PRESENT' AND a.date >= CURRENT_DATE - INTERVAL '30 days')::DECIMAL /
       NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'), 0)) * 100,
      2
    ),
    0
  ) as attendance_rate_30d,
  COALESCE(
    ROUND(
      (COUNT(a.id) FILTER (WHERE a.is_late = true AND a.date >= CURRENT_DATE - INTERVAL '30 days')::DECIMAL /
       NULLIF(COUNT(a.id) FILTER (WHERE a.date >= CURRENT_DATE - INTERVAL '30 days'), 0)) * 100,
      2
    ),
    0
  ) as late_rate_30d,
  -- Leave requests
  COUNT(lr.id) FILTER (WHERE lr.status = 'PENDING') as pending_leaves,
  -- Overtime
  COUNT(ot.id) FILTER (WHERE ot.status = 'PENDING') as pending_overtime
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
LEFT JOIN attendances a ON e.id = a.employee_id
LEFT JOIN leave_requests lr ON e.id = lr.employee_id
LEFT JOIN overtime_requests ot ON e.id = ot.employee_id
GROUP BY d.id, d.name, d.code;

-- =====================================================
-- VIEW 8: FREQUENT LATE EMPLOYEES (Last 7 days)
-- =====================================================

CREATE OR REPLACE VIEW vw_frequent_late_employees AS
SELECT
  e.id as employee_id,
  e.employee_code,
  e.full_name,
  d.name as department_name,
  COUNT(*) as late_count,
  ARRAY_AGG(a.date ORDER BY a.date DESC) as late_dates
FROM attendances a
JOIN employees e ON a.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
WHERE a.is_late = true
  AND a.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY e.id, e.employee_code, e.full_name, d.name
HAVING COUNT(*) >= 2
ORDER BY COUNT(*) DESC
LIMIT 10;

-- =====================================================
-- INDEXES FOR VIEWS (if not already exist)
-- =====================================================

-- These indexes support the views above
CREATE INDEX IF NOT EXISTS idx_attendances_date_status 
ON attendances(date, status);

CREATE INDEX IF NOT EXISTS idx_employees_created_at 
ON employees(created_at);

CREATE INDEX IF NOT EXISTS idx_employees_updated_at 
ON employees(updated_at);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- To verify views were created:
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'vw_%';

-- To test performance:
-- EXPLAIN ANALYZE SELECT * FROM vw_today_snapshot;
-- EXPLAIN ANALYZE SELECT * FROM vw_employee_turnover_monthly;

