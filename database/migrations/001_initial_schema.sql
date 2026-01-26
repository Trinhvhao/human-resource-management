-- =====================================================
-- HỆ THỐNG QUẢN LÝ NHÂN SỰ - INITIAL SCHEMA
-- Database: PostgreSQL (Supabase)
-- Version: 1.0
-- Created: 2026-01-15
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. BẢNG USERS - Quản lý tài khoản đăng nhập
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE')),
    employee_id UUID UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employee_id);

COMMENT ON TABLE users IS 'Bảng quản lý tài khoản đăng nhập';
COMMENT ON COLUMN users.password_hash IS 'Mật khẩu đã hash (bcrypt)';
COMMENT ON COLUMN users.role IS 'Vai trò: ADMIN, HR_MANAGER, MANAGER, EMPLOYEE';

-- =====================================================
-- 2. BẢNG DEPARTMENTS - Quản lý phòng ban
-- =====================================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);

COMMENT ON TABLE departments IS 'Bảng quản lý phòng ban (hỗ trợ phân cấp)';
COMMENT ON COLUMN departments.parent_id IS 'ID phòng ban cha (cho cấu trúc cây)';

-- =====================================================
-- 3. BẢNG EMPLOYEES - Quản lý nhân viên
-- =====================================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    id_card VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    position VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    
    base_salary DECIMAL(12,2) NOT NULL CHECK (base_salary >= 0),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_full_name ON employees(full_name);

COMMENT ON TABLE employees IS 'Bảng quản lý thông tin nhân viên';
COMMENT ON COLUMN employees.employee_code IS 'Mã nhân viên (tự động sinh)';
COMMENT ON COLUMN employees.id_card IS 'CMND/CCCD';
COMMENT ON COLUMN employees.status IS 'Trạng thái: ACTIVE, INACTIVE, ON_LEAVE';

-- Add foreign key for users.employee_id
ALTER TABLE users ADD CONSTRAINT fk_users_employee 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Add foreign key for departments.manager_id
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- =====================================================
-- 4. BẢNG CONTRACTS - Quản lý hợp đồng lao động
-- =====================================================

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('PROBATION', 'FIXED_TERM', 'INDEFINITE')),
    contract_number VARCHAR(100) UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE,
    salary DECIMAL(12,2) NOT NULL CHECK (salary >= 0),
    terms TEXT,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'TERMINATED')),
    terminated_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_end_date CHECK (
        (contract_type = 'INDEFINITE' AND end_date IS NULL) OR
        (contract_type != 'INDEFINITE' AND end_date IS NOT NULL AND end_date > start_date)
    )
);

CREATE INDEX idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_end_date ON contracts(end_date) WHERE status = 'ACTIVE';

COMMENT ON TABLE contracts IS 'Bảng quản lý hợp đồng lao động';
COMMENT ON COLUMN contracts.contract_type IS 'Loại hợp đồng: PROBATION (thử việc), FIXED_TERM (có thời hạn), INDEFINITE (không thời hạn)';

-- =====================================================
-- 5. BẢNG ATTENDANCES - Quản lý chấm công
-- =====================================================

CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    work_hours DECIMAL(5,2),
    is_late BOOLEAN DEFAULT false,
    is_early_leave BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE', 'HOLIDAY')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_employee_date UNIQUE(employee_id, date),
    CONSTRAINT check_work_hours CHECK (work_hours >= 0 AND work_hours <= 24)
);

CREATE INDEX idx_attendances_employee_id ON attendances(employee_id);
CREATE INDEX idx_attendances_date ON attendances(date);
CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, date);

COMMENT ON TABLE attendances IS 'Bảng quản lý chấm công';
COMMENT ON COLUMN attendances.work_hours IS 'Số giờ làm việc (tính từ check_in đến check_out)';

-- =====================================================
-- 6. BẢNG LEAVE_REQUESTS - Quản lý đơn xin nghỉ
-- =====================================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PERSONAL')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejected_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

COMMENT ON TABLE leave_requests IS 'Bảng quản lý đơn xin nghỉ phép';
COMMENT ON COLUMN leave_requests.leave_type IS 'Loại nghỉ: ANNUAL (phép năm), SICK (ốm), UNPAID (không lương), MATERNITY (thai sản), PERSONAL (cá nhân)';

-- =====================================================
-- 7. BẢNG PAYROLLS - Quản lý bảng lương tháng
-- =====================================================

CREATE TABLE payrolls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2020),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINALIZED', 'PAID')),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    finalized_at TIMESTAMP,
    finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_month_year UNIQUE(month, year)
);

CREATE INDEX idx_payrolls_month_year ON payrolls(year, month);
CREATE INDEX idx_payrolls_status ON payrolls(status);

COMMENT ON TABLE payrolls IS 'Bảng quản lý bảng lương theo tháng';
COMMENT ON COLUMN payrolls.status IS 'Trạng thái: DRAFT (nháp), FINALIZED (đã chốt), PAID (đã trả)';

-- =====================================================
-- 8. BẢNG PAYROLL_ITEMS - Chi tiết lương từng nhân viên
-- =====================================================

CREATE TABLE payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Lương cơ bản
    base_salary DECIMAL(12,2) NOT NULL,
    work_days INT NOT NULL,
    actual_work_days DECIMAL(5,2) NOT NULL,
    
    -- Phụ cấp
    allowances DECIMAL(12,2) DEFAULT 0,
    
    -- Thưởng phạt
    bonus DECIMAL(12,2) DEFAULT 0,
    deduction DECIMAL(12,2) DEFAULT 0,
    
    -- Làm thêm giờ
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    
    -- Bảo hiểm (BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5%)
    insurance DECIMAL(12,2) DEFAULT 0,
    
    -- Thuế TNCN
    tax DECIMAL(12,2) DEFAULT 0,
    
    -- Tổng lương thực nhận
    net_salary DECIMAL(12,2) NOT NULL,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_payroll_employee UNIQUE(payroll_id, employee_id)
);

CREATE INDEX idx_payroll_items_payroll_id ON payroll_items(payroll_id);
CREATE INDEX idx_payroll_items_employee_id ON payroll_items(employee_id);

COMMENT ON TABLE payroll_items IS 'Bảng chi tiết lương từng nhân viên';
COMMENT ON COLUMN payroll_items.net_salary IS 'Lương thực nhận = base_salary * (actual_work_days/work_days) + allowances + bonus - deduction + overtime_pay - insurance - tax';

-- =====================================================
-- 9. BẢNG REWARDS - Quản lý khen thưởng
-- =====================================================

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    reward_date DATE NOT NULL,
    reward_type VARCHAR(50) CHECK (reward_type IN ('BONUS', 'ACHIEVEMENT', 'PERFORMANCE', 'OTHER')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rewards_employee_id ON rewards(employee_id);
CREATE INDEX idx_rewards_reward_date ON rewards(reward_date);

COMMENT ON TABLE rewards IS 'Bảng quản lý khen thưởng nhân viên';

-- =====================================================
-- 10. BẢNG DISCIPLINES - Quản lý kỷ luật
-- =====================================================

CREATE TABLE disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    discipline_type VARCHAR(50) NOT NULL CHECK (discipline_type IN ('WARNING', 'FINE', 'SUSPENSION', 'TERMINATION')),
    amount DECIMAL(12,2) DEFAULT 0 CHECK (amount >= 0),
    discipline_date DATE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disciplines_employee_id ON disciplines(employee_id);
CREATE INDEX idx_disciplines_discipline_date ON disciplines(discipline_date);

COMMENT ON TABLE disciplines IS 'Bảng quản lý kỷ luật nhân viên';
COMMENT ON COLUMN disciplines.discipline_type IS 'Loại kỷ luật: WARNING (cảnh cáo), FINE (phạt tiền), SUSPENSION (đình chỉ), TERMINATION (sa thải)';

-- =====================================================
-- 11. BẢNG EMPLOYEE_HISTORY - Lịch sử thay đổi (Audit Trail)
-- =====================================================

CREATE TABLE employee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_history_employee_id ON employee_history(employee_id);
CREATE INDEX idx_employee_history_changed_at ON employee_history(changed_at);

COMMENT ON TABLE employee_history IS 'Bảng lưu lịch sử thay đổi thông tin nhân viên (audit trail)';
COMMENT ON COLUMN employee_history.field IS 'Tên trường bị thay đổi (vd: position, salary, department_id)';

-- =====================================================
-- 12. BẢNG CHAT_MESSAGES - Lịch sử chat với AI Chatbot
-- =====================================================

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

COMMENT ON TABLE chat_messages IS 'Bảng lưu lịch sử chat với AI chatbot';
COMMENT ON COLUMN chat_messages.conversation_id IS 'ID cuộc hội thoại (nhóm các tin nhắn liên quan)';
COMMENT ON COLUMN chat_messages.context IS 'Ngữ cảnh cuộc hội thoại (JSONB): employee_id, role, etc.';

-- =====================================================
-- 13. BẢNG AUDIT_LOGS - Log hệ thống
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

COMMENT ON TABLE audit_logs IS 'Bảng log mọi hành động quan trọng trong hệ thống';
COMMENT ON COLUMN audit_logs.action IS 'Hành động: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.';
COMMENT ON COLUMN audit_logs.resource_type IS 'Loại tài nguyên: employees, contracts, payrolls, etc.';

-- =====================================================
-- TRIGGERS - Tự động cập nhật updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payrolls_updated_at BEFORE UPDATE ON payrolls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_items_updated_at BEFORE UPDATE ON payroll_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplines_updated_at BEFORE UPDATE ON disciplines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS - Helper functions
-- =====================================================

-- Function: Generate employee code
CREATE OR REPLACE FUNCTION generate_employee_code()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_code VARCHAR(50);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate code: EMP + year + random 4 digits
        new_code := 'EMP' || TO_CHAR(CURRENT_DATE, 'YY') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Check if code exists
        SELECT EXISTS(SELECT 1 FROM employees WHERE employee_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_employee_code() IS 'Tự động sinh mã nhân viên duy nhất (format: EMPYY####)';

-- =====================================================
-- VIEWS - Materialized views for reports
-- =====================================================

-- View: Employee statistics by department
CREATE MATERIALIZED VIEW mv_employee_stats AS
SELECT 
    d.id as department_id,
    d.code as department_code,
    d.name as department_name,
    COUNT(e.id) as total_employees,
    COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) as active_employees,
    COUNT(CASE WHEN e.status = 'INACTIVE' THEN 1 END) as inactive_employees,
    COUNT(CASE WHEN e.gender = 'MALE' THEN 1 END) as male_count,
    COUNT(CASE WHEN e.gender = 'FEMALE' THEN 1 END) as female_count,
    AVG(e.base_salary) as avg_salary,
    MIN(e.base_salary) as min_salary,
    MAX(e.base_salary) as max_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.code, d.name;

CREATE UNIQUE INDEX ON mv_employee_stats(department_id);

COMMENT ON MATERIALIZED VIEW mv_employee_stats IS 'Thống kê nhân viên theo phòng ban (cần refresh định kỳ)';

-- =====================================================
-- INITIAL DATA - Chỉ tạo admin account
-- =====================================================

-- Insert sample admin user (password: Password@123)
-- Note: In production, hash this properly with bcrypt
INSERT INTO users (email, password_hash, role, is_active) VALUES
('admin@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'ADMIN', true)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- GRANTS - Permissions (adjust based on your needs)
-- =====================================================

-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_employee_stats;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Total tables: 13';
    RAISE NOTICE '🔍 Total indexes: 40+';
    RAISE NOTICE '⚡ Total triggers: 10';
    RAISE NOTICE '📈 Total views: 1';
END $$;
