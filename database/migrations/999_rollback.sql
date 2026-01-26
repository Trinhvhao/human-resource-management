-- =====================================================
-- ROLLBACK SCRIPT - Xóa toàn bộ schema
-- =====================================================
-- ⚠️ WARNING: Script này sẽ xóa TẤT CẢ dữ liệu!
-- Chỉ sử dụng trong môi trường development/testing
-- =====================================================

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS mv_employee_stats CASCADE;

-- Drop tables in reverse order (respect foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS employee_history CASCADE;
DROP TABLE IF EXISTS disciplines CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS payrolls CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendances CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_employee_code() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extensions (optional - comment out if used by other schemas)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All tables, views, and functions dropped successfully!';
    RAISE NOTICE '⚠️  Database is now empty.';
END $$;
