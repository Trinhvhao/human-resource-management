# Database Indexes Guide

## Overview
This document describes the database indexes implemented for optimal query performance in the HR Management System.

## Index Statistics
- **Total Indexes**: 38
- **Migration Files**: 
  - `004_add_performance_indexes` - Basic indexes
  - `005_add_advanced_indexes` - Advanced composite and partial indexes

## Index Categories

### 1. Employee Management Indexes

#### Basic Indexes
- `idx_employee_status` - Filter by employee status
- `idx_employee_department` - Filter by department
- `idx_employee_code` - Lookup by employee code
- `idx_employee_email` - Lookup by email

#### Advanced Indexes
- `idx_employee_dept_status` - Composite index for department + status queries
- `idx_employee_fullname` - Text search optimization
- `idx_employee_dob_month_day` - Birthday queries
- `idx_employee_active` - Partial index for active employees only
- `idx_employee_list` - Covering index for list queries
- `idx_employee_created` - Recent employee queries
- `idx_employee_updated` - Recently updated employees

**Use Cases:**
```sql
-- Optimized by idx_employee_dept_status
SELECT * FROM employees 
WHERE department_id = ? AND status = 'ACTIVE' 
ORDER BY start_date DESC;

-- Optimized by idx_employee_fullname
SELECT * FROM employees 
WHERE full_name ILIKE '%nguyen%';

-- Optimized by idx_employee_active (partial index)
SELECT * FROM employees 
WHERE status = 'ACTIVE' AND department_id = ?;
```

### 2. Attendance Indexes

#### Basic Indexes
- `idx_attendance_employee_date` - Employee attendance lookup
- `idx_attendance_date` - Date-based queries
- `idx_attendance_status` - Status filtering

#### Advanced Indexes
- `idx_attendance_employee_date_status` - Composite for complex queries
- `idx_attendance_date_late` - Partial index for late arrivals
- `idx_attendance_date_early` - Partial index for early departures
- `idx_attendance_summary` - Covering index for summary queries
- `idx_attendance_date_count` - Optimized COUNT queries

**Use Cases:**
```sql
-- Optimized by idx_attendance_employee_date_status
SELECT * FROM attendances 
WHERE employee_id = ? AND date BETWEEN ? AND ? AND status = 'PRESENT';

-- Optimized by idx_attendance_date_late (partial index)
SELECT * FROM attendances 
WHERE date >= ? AND is_late = true;

-- Optimized by idx_attendance_summary (covering index)
SELECT date, status, COUNT(*), AVG(work_hours) 
FROM attendances 
WHERE date BETWEEN ? AND ? 
GROUP BY date, status;
```

### 3. Leave Request Indexes

#### Basic Indexes
- `idx_leave_employee` - Employee leave history
- `idx_leave_status` - Status filtering
- `idx_leave_dates` - Date range queries

#### Advanced Indexes
- `idx_leave_status_dates` - Dashboard queries optimization
- `idx_leave_employee_status_date` - Employee leave history
- `idx_leave_approver_status` - Approver queries
- `idx_leave_pending` - Partial index for pending requests
- `idx_leave_created` - Recent requests

**Use Cases:**
```sql
-- Optimized by idx_leave_status_dates
SELECT * FROM leave_requests 
WHERE status = 'PENDING' AND start_date >= CURRENT_DATE 
ORDER BY start_date DESC;

-- Optimized by idx_leave_employee_status_date
SELECT * FROM leave_requests 
WHERE employee_id = ? AND status = 'APPROVED' 
ORDER BY start_date DESC;

-- Optimized by idx_leave_pending (partial index)
SELECT * FROM leave_requests 
WHERE status = 'PENDING' 
ORDER BY created_at DESC;
```

### 4. Overtime Request Indexes

#### Basic Indexes
- `idx_overtime_employee` - Employee overtime history
- `idx_overtime_status` - Status filtering
- `idx_overtime_date` - Date-based queries

#### Advanced Indexes
- `idx_overtime_employee_status_date` - Employee overtime history
- `idx_overtime_approver_status` - Approver queries
- `idx_overtime_status_date` - Approved overtime calculations
- `idx_overtime_pending` - Partial index for pending requests
- `idx_overtime_created` - Recent requests

**Use Cases:**
```sql
-- Optimized by idx_overtime_employee_status_date
SELECT * FROM overtime_requests 
WHERE employee_id = ? AND status = 'APPROVED' 
ORDER BY date DESC;

-- Optimized by idx_overtime_status_date (partial index)
SELECT SUM(hours) FROM overtime_requests 
WHERE status = 'APPROVED' AND date BETWEEN ? AND ?;
```

### 5. Contract Management Indexes

#### Basic Indexes
- None in basic migration

#### Advanced Indexes
- `idx_contract_status_enddate` - Expiring contracts (partial index)
- `idx_contract_employee_status` - Employee contract history

**Use Cases:**
```sql
-- Optimized by idx_contract_status_enddate (partial index)
SELECT * FROM contracts 
WHERE status = 'ACTIVE' 
  AND end_date IS NOT NULL 
  AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
ORDER BY end_date ASC;

-- Optimized by idx_contract_employee_status
SELECT * FROM contracts 
WHERE employee_id = ? AND status = 'ACTIVE' 
ORDER BY start_date DESC;
```

### 6. Payroll Indexes

#### Basic Indexes
- `idx_payroll_month_year` - Month/year lookup
- `idx_payroll_status` - Status filtering

#### Advanced Indexes
- `idx_payroll_year_month_status` - Composite for complex queries
- `idx_payroll_item_employee` - Employee payroll history

**Use Cases:**
```sql
-- Optimized by idx_payroll_year_month_status
SELECT * FROM payrolls 
WHERE year = ? AND status = 'FINALIZED' 
ORDER BY month DESC;

-- Optimized by idx_payroll_item_employee
SELECT * FROM payroll_items 
WHERE employee_id = ? 
ORDER BY payroll_id DESC;
```

### 7. Rewards & Disciplines Indexes

#### Advanced Indexes
- `idx_reward_employee_date` - Employee rewards history
- `idx_reward_type_date` - Type-based queries
- `idx_discipline_employee_date` - Employee disciplines history
- `idx_discipline_type_date` - Type-based queries

**Use Cases:**
```sql
-- Optimized by idx_reward_employee_date
SELECT * FROM rewards 
WHERE employee_id = ? 
ORDER BY reward_date DESC;

-- Optimized by idx_discipline_type_date
SELECT * FROM disciplines 
WHERE discipline_type = 'WARNING' 
ORDER BY discipline_date DESC;
```

### 8. User & Authentication Indexes

#### Basic Indexes
- `idx_user_email` - Email lookup (login)
- `idx_user_employee` - Employee-user relationship
- `idx_user_role` - Role-based queries

**Use Cases:**
```sql
-- Optimized by idx_user_email
SELECT * FROM users WHERE email = ?;

-- Optimized by idx_user_role
SELECT * FROM users WHERE role = 'ADMIN';
```

### 9. Department Indexes

#### Basic Indexes
- `idx_department_parent` - Hierarchical queries
- `idx_department_manager` - Manager lookup

**Use Cases:**
```sql
-- Optimized by idx_department_parent
SELECT * FROM departments WHERE parent_id = ?;

-- Optimized by idx_department_manager
SELECT * FROM departments WHERE manager_id = ?;
```

## Index Types Explained

### 1. Simple Index
Single column index for basic filtering.
```sql
CREATE INDEX idx_name ON table(column);
```

### 2. Composite Index
Multiple columns for complex queries. **Order matters!**
```sql
CREATE INDEX idx_name ON table(col1, col2, col3);
-- Optimizes: WHERE col1 = ? AND col2 = ?
-- Also optimizes: WHERE col1 = ?
-- Does NOT optimize: WHERE col2 = ?
```

### 3. Partial Index
Index only specific rows matching a condition. **Smaller and faster!**
```sql
CREATE INDEX idx_name ON table(column) WHERE condition;
-- Example: Only index active employees
CREATE INDEX idx_active ON employees(department_id) WHERE status = 'ACTIVE';
```

### 4. Covering Index (INCLUDE)
Include additional columns to avoid table lookups.
```sql
CREATE INDEX idx_name ON table(col1) INCLUDE (col2, col3);
-- Query can be satisfied entirely from index
```

### 5. Text Search Index
Optimize LIKE and ILIKE queries.
```sql
CREATE INDEX idx_name ON table(column text_pattern_ops);
-- Optimizes: WHERE column LIKE 'prefix%'
```

## Performance Tips

### 1. Use EXPLAIN ANALYZE
Always check query plans before and after adding indexes:
```sql
EXPLAIN ANALYZE
SELECT * FROM employees WHERE status = 'ACTIVE';
```

### 2. Monitor Index Usage
Check which indexes are actually being used:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 3. Find Unused Indexes
Remove indexes that are never used:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 4. Regular Maintenance
Run ANALYZE periodically to update statistics:
```sql
ANALYZE employees;
ANALYZE attendances;
-- Or analyze all tables:
ANALYZE;
```

### 5. Vacuum for Space Reclamation
Run VACUUM to reclaim space (outside transactions):
```bash
# Connect to database and run:
VACUUM ANALYZE;
```

## Query Optimization Examples

### Before Optimization
```sql
-- Slow: Full table scan
SELECT * FROM attendances 
WHERE employee_id = '...' AND date BETWEEN '2026-01-01' AND '2026-01-31';

-- Execution time: ~500ms
```

### After Optimization
```sql
-- Fast: Uses idx_attendance_employee_date_status
SELECT * FROM attendances 
WHERE employee_id = '...' AND date BETWEEN '2026-01-01' AND '2026-01-31';

-- Execution time: ~5ms (100x faster!)
```

## Common Query Patterns

### Dashboard Overview
```sql
-- Optimized by multiple indexes
SELECT 
  (SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE') as active_employees,
  (SELECT COUNT(*) FROM leave_requests WHERE status = 'PENDING') as pending_leaves,
  (SELECT COUNT(*) FROM overtime_requests WHERE status = 'PENDING') as pending_overtime,
  (SELECT COUNT(*) FROM contracts WHERE status = 'ACTIVE' AND end_date < CURRENT_DATE + 30) as expiring_contracts;
```

### Employee Attendance Report
```sql
-- Optimized by idx_attendance_employee_date_status
SELECT 
  date,
  status,
  check_in,
  check_out,
  work_hours,
  is_late,
  is_early_leave
FROM attendances
WHERE employee_id = ? 
  AND date BETWEEN ? AND ?
ORDER BY date DESC;
```

### Expiring Contracts
```sql
-- Optimized by idx_contract_status_enddate (partial index)
SELECT 
  c.*,
  e.full_name,
  e.employee_code
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE c.status = 'ACTIVE'
  AND c.end_date IS NOT NULL
  AND c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
ORDER BY c.end_date ASC;
```

## Maintenance Scripts

### Apply Indexes
```bash
cd apps/backend
node apply-indexes.js
```

### Check Index Health
```bash
cd apps/backend
node check-indexes.js  # (create this script if needed)
```

## Best Practices

1. **Index Selectivity**: Index columns with high cardinality (many unique values)
2. **Composite Index Order**: Most selective column first
3. **Avoid Over-Indexing**: Each index has write overhead
4. **Use Partial Indexes**: When filtering on specific conditions
5. **Monitor Performance**: Regularly check slow query logs
6. **Update Statistics**: Run ANALYZE after bulk data changes
7. **Test Before Production**: Always test indexes on staging first

## Troubleshooting

### Query Still Slow?
1. Check if index is being used: `EXPLAIN ANALYZE your_query`
2. Verify index exists: `\di` in psql
3. Check statistics are up to date: `ANALYZE table_name`
4. Consider adding covering index to avoid table lookups
5. Check for table bloat: May need VACUUM FULL

### Index Not Being Used?
1. Statistics may be outdated: Run `ANALYZE`
2. Query may not match index pattern
3. Table may be too small (PostgreSQL prefers seq scan)
4. Index may be corrupted: `REINDEX INDEX index_name`

## Resources

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Explain Analyze Tool](https://explain.depesz.com/)
- [Index Advisor](https://github.com/ankane/dexter)

## Changelog

### 2026-01-27
- Added 38 indexes across all tables
- Implemented composite, partial, and covering indexes
- Added ANALYZE statements for statistics update
- Created apply-indexes.js script for easy deployment
