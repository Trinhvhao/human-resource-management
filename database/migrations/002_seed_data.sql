-- =====================================================
-- SEED DATA - Dữ liệu mẫu cho testing
-- =====================================================

-- =====================================================
-- 1. DEPARTMENTS - Phòng ban mẫu
-- =====================================================

-- Xóa departments cũ nếu có (để tránh conflict)
DELETE FROM departments WHERE code IN ('IT', 'HR', 'ACC', 'MKT', 'SALE');

INSERT INTO departments (id, code, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'IT', 'Phòng Công Nghệ Thông Tin', 'Phát triển và bảo trì hệ thống công nghệ'),
('22222222-2222-2222-2222-222222222222', 'HR', 'Phòng Nhân Sự', 'Quản lý nhân sự, tuyển dụng và đào tạo'),
('33333333-3333-3333-3333-333333333333', 'ACC', 'Phòng Kế Toán', 'Quản lý tài chính, kế toán và thuế'),
('44444444-4444-4444-4444-444444444444', 'MKT', 'Phòng Marketing', 'Marketing, truyền thông và quảng cáo'),
('55555555-5555-5555-5555-555555555555', 'SALE', 'Phòng Kinh Doanh', 'Bán hàng và chăm sóc khách hàng');

-- =====================================================
-- 2. EMPLOYEES - Nhân viên mẫu
-- =====================================================

INSERT INTO employees (id, employee_code, full_name, date_of_birth, gender, id_card, address, phone, email, department_id, position, start_date, status, base_salary) VALUES
-- IT Department
('a0000000-0000-4000-8000-000000000001', 'EMP24001', 'Nguyễn Văn An', '1990-05-15', 'MALE', '001090012345', 'Hà Nội', '0912345001', 'nva@company.com', '11111111-1111-1111-1111-111111111111', 'Senior Developer', '2020-01-15', 'ACTIVE', 25000000),
('a0000000-0000-4000-8000-000000000002', 'EMP24002', 'Trần Thị Bình', '1992-08-20', 'FEMALE', '001092023456', 'Hà Nội', '0912345002', 'ttb@company.com', '11111111-1111-1111-1111-111111111111', 'Developer', '2021-03-10', 'ACTIVE', 18000000),
('a0000000-0000-4000-8000-000000000003', 'EMP24003', 'Lê Văn Cường', '1995-12-01', 'MALE', '001095034567', 'Hà Nội', '0912345003', 'lvc@company.com', '11111111-1111-1111-1111-111111111111', 'Junior Developer', '2023-06-01', 'ACTIVE', 12000000),

-- HR Department
('a0000000-0000-4000-8000-000000000004', 'EMP24004', 'Phạm Thị Dung', '1988-03-25', 'FEMALE', '001088045678', 'Hà Nội', '0912345004', 'ptd@company.com', '22222222-2222-2222-2222-222222222222', 'HR Manager', '2019-02-01', 'ACTIVE', 22000000),
('a0000000-0000-4000-8000-000000000005', 'EMP24005', 'Hoàng Văn Em', '1993-07-10', 'MALE', '001093056789', 'Hà Nội', '0912345005', 'hve@company.com', '22222222-2222-2222-2222-222222222222', 'HR Specialist', '2022-04-15', 'ACTIVE', 15000000),

-- Accounting Department
('a0000000-0000-4000-8000-000000000006', 'EMP24006', 'Vũ Thị Phương', '1991-11-30', 'FEMALE', '001091067890', 'Hà Nội', '0912345006', 'vtp@company.com', '33333333-3333-3333-3333-333333333333', 'Chief Accountant', '2020-05-20', 'ACTIVE', 20000000),
('a0000000-0000-4000-8000-000000000007', 'EMP24007', 'Đỗ Văn Giang', '1994-09-05', 'MALE', '001094078901', 'Hà Nội', '0912345007', 'dvg@company.com', '33333333-3333-3333-3333-333333333333', 'Accountant', '2022-08-01', 'ACTIVE', 14000000),

-- Marketing Department
('a0000000-0000-4000-8000-000000000008', 'EMP24008', 'Bùi Thị Hoa', '1996-02-14', 'FEMALE', '001096089012', 'Hà Nội', '0912345008', 'bth@company.com', '44444444-4444-4444-4444-444444444444', 'Marketing Manager', '2021-01-10', 'ACTIVE', 19000000),

-- Sales Department
('a0000000-0000-4000-8000-000000000009', 'EMP24009', 'Ngô Văn Ích', '1989-06-22', 'MALE', '001089090123', 'Hà Nội', '0912345009', 'nvi@company.com', '55555555-5555-5555-5555-555555555555', 'Sales Manager', '2019-09-01', 'ACTIVE', 21000000),
('a0000000-0000-4000-8000-000000000010', 'EMP24010', 'Đinh Thị Kim', '1997-04-18', 'FEMALE', '001097001234', 'Hà Nội', '0912345010', 'dtk@company.com', '55555555-5555-5555-5555-555555555555', 'Sales Executive', '2023-02-15', 'ACTIVE', 13000000);

-- =====================================================
-- 3. USERS - Tài khoản đăng nhập
-- =====================================================

-- Password for all: Password@123
-- Hash: $2b$10$rKvVPZqGhXqKXPZqGhXqKe (example, use real bcrypt in production)

INSERT INTO users (email, password_hash, role, employee_id, is_active) VALUES
-- Admin account (skip if exists)
('admin@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'ADMIN', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- Other users
INSERT INTO users (email, password_hash, role, employee_id, is_active) VALUES
-- HR Manager
('ptd@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'HR_MANAGER', 'a0000000-0000-4000-8000-000000000004', true),

-- Managers
('nva@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'MANAGER', 'a0000000-0000-4000-8000-000000000001', true),
('bth@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'MANAGER', 'a0000000-0000-4000-8000-000000000008', true),
('nvi@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'MANAGER', 'a0000000-0000-4000-8000-000000000009', true),

-- Employees
('ttb@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000002', true),
('lvc@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000003', true),
('hve@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000005', true),
('vtp@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000006', true),
('dvg@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000007', true),
('dtk@company.com', '$2b$10$rKvVPZqGhXqKXPZqGhXqKe', 'EMPLOYEE', 'a0000000-0000-4000-8000-000000000010', true)
ON CONFLICT (email) DO NOTHING;

-- Update department managers
UPDATE departments SET manager_id = 'a0000000-0000-4000-8000-000000000001' WHERE code = 'IT';
UPDATE departments SET manager_id = 'a0000000-0000-4000-8000-000000000004' WHERE code = 'HR';
UPDATE departments SET manager_id = 'a0000000-0000-4000-8000-000000000006' WHERE code = 'ACC';
UPDATE departments SET manager_id = 'a0000000-0000-4000-8000-000000000008' WHERE code = 'MKT';
UPDATE departments SET manager_id = 'a0000000-0000-4000-8000-000000000009' WHERE code = 'SALE';

-- =====================================================
-- 4. CONTRACTS - Hợp đồng mẫu
-- =====================================================

INSERT INTO contracts (employee_id, contract_type, contract_number, start_date, end_date, salary, status) VALUES
('a0000000-0000-4000-8000-000000000001', 'INDEFINITE', 'HD2020001', '2020-01-15', NULL, 25000000, 'ACTIVE'),
('a0000000-0000-4000-8000-000000000002', 'FIXED_TERM', 'HD2021001', '2021-03-10', '2024-03-09', 18000000, 'ACTIVE'),
('a0000000-0000-4000-8000-000000000003', 'PROBATION', 'HD2023001', '2023-06-01', '2023-08-31', 12000000, 'EXPIRED'),
('a0000000-0000-4000-8000-000000000003', 'FIXED_TERM', 'HD2023002', '2023-09-01', '2025-08-31', 12000000, 'ACTIVE'),
('a0000000-0000-4000-8000-000000000004', 'INDEFINITE', 'HD2019001', '2019-02-01', NULL, 22000000, 'ACTIVE'),
('a0000000-0000-4000-8000-000000000005', 'FIXED_TERM', 'HD2022001', '2022-04-15', '2025-04-14', 15000000, 'ACTIVE');

-- =====================================================
-- 5. ATTENDANCES - Chấm công mẫu (tháng hiện tại)
-- =====================================================

-- Generate attendance for last 10 days
DO $$
DECLARE
    emp_id UUID;
    day_offset INT;
    attendance_date DATE;
BEGIN
    FOR emp_id IN SELECT id FROM employees WHERE status = 'ACTIVE' LIMIT 5
    LOOP
        FOR day_offset IN 1..10
        LOOP
            attendance_date := CURRENT_DATE - day_offset;
            
            -- Skip weekends
            IF EXTRACT(DOW FROM attendance_date) NOT IN (0, 6) THEN
                INSERT INTO attendances (employee_id, date, check_in, check_out, work_hours, is_late, status)
                VALUES (
                    emp_id,
                    attendance_date,
                    attendance_date + TIME '08:00:00' + (RANDOM() * INTERVAL '30 minutes'),
                    attendance_date + TIME '17:00:00' + (RANDOM() * INTERVAL '30 minutes'),
                    8 + (RANDOM() * 2),
                    RANDOM() < 0.1, -- 10% chance of being late
                    'PRESENT'
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- 6. LEAVE_REQUESTS - Đơn xin nghỉ mẫu
-- =====================================================

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status) VALUES
('a0000000-0000-4000-8000-000000000002', 'ANNUAL', CURRENT_DATE + 5, CURRENT_DATE + 7, 3, 'Nghỉ phép năm', 'PENDING'),
('a0000000-0000-4000-8000-000000000003', 'SICK', CURRENT_DATE - 2, CURRENT_DATE - 2, 1, 'Ốm', 'APPROVED'),
('a0000000-0000-4000-8000-000000000005', 'PERSONAL', CURRENT_DATE + 10, CURRENT_DATE + 12, 3, 'Việc gia đình', 'PENDING');

-- =====================================================
-- 7. REWARDS - Khen thưởng mẫu
-- =====================================================

INSERT INTO rewards (employee_id, reason, amount, reward_date, reward_type, created_by) VALUES
('a0000000-0000-4000-8000-000000000001', 'Hoàn thành xuất sắc dự án X', 5000000, '2024-12-25', 'PERFORMANCE', (SELECT id FROM users WHERE email = 'admin@company.com')),
('a0000000-0000-4000-8000-000000000002', 'Nhân viên xuất sắc tháng 12', 2000000, '2024-12-31', 'ACHIEVEMENT', (SELECT id FROM users WHERE email = 'admin@company.com'));

-- =====================================================
-- 8. DISCIPLINES - Kỷ luật mẫu
-- =====================================================

INSERT INTO disciplines (employee_id, reason, discipline_type, amount, discipline_date, created_by) VALUES
('a0000000-0000-4000-8000-000000000010', 'Đi muộn 3 lần trong tháng', 'WARNING', 0, '2024-12-15', (SELECT id FROM users WHERE email = 'admin@company.com'));

-- =====================================================
-- 9. PAYROLL - Bảng lương tháng 12/2024
-- =====================================================

INSERT INTO payrolls (month, year, status, total_amount) VALUES
(12, 2024, 'FINALIZED', 169000000);

-- =====================================================
-- 10. PAYROLL_ITEMS - Chi tiết lương tháng 12/2024
-- =====================================================

INSERT INTO payroll_items (
    payroll_id, 
    employee_id, 
    base_salary, 
    work_days, 
    actual_work_days, 
    allowances, 
    bonus, 
    deduction, 
    overtime_hours, 
    overtime_pay, 
    insurance, 
    tax, 
    net_salary
)
SELECT 
    (SELECT id FROM payrolls WHERE month = 12 AND year = 2024),
    e.id,
    e.base_salary,
    22, -- Total work days in December
    20 + (RANDOM() * 2)::INT, -- Actual work days (20-22)
    1000000, -- Allowances
    CASE WHEN r.amount IS NOT NULL THEN r.amount ELSE 0 END, -- Bonus from rewards
    CASE WHEN d.amount IS NOT NULL THEN d.amount ELSE 0 END, -- Deduction from disciplines
    0, -- Overtime hours
    0, -- Overtime pay
    e.base_salary * 0.105, -- Insurance 10.5%
    (e.base_salary - e.base_salary * 0.105 - 11000000) * 0.1, -- Tax (simplified)
    e.base_salary + 1000000 + COALESCE(r.amount, 0) - COALESCE(d.amount, 0) - (e.base_salary * 0.105) - ((e.base_salary - e.base_salary * 0.105 - 11000000) * 0.1)
FROM employees e
LEFT JOIN (
    SELECT employee_id, SUM(amount) as amount 
    FROM rewards 
    WHERE EXTRACT(MONTH FROM reward_date) = 12 AND EXTRACT(YEAR FROM reward_date) = 2024
    GROUP BY employee_id
) r ON e.id = r.employee_id
LEFT JOIN (
    SELECT employee_id, SUM(amount) as amount 
    FROM disciplines 
    WHERE EXTRACT(MONTH FROM discipline_date) = 12 AND EXTRACT(YEAR FROM discipline_date) = 2024
    GROUP BY employee_id
) d ON e.id = d.employee_id
WHERE e.status = 'ACTIVE';

-- =====================================================
-- Refresh materialized view
-- =====================================================

REFRESH MATERIALIZED VIEW mv_employee_stats;

-- =====================================================
-- Success message
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Seed data inserted successfully!';
    RAISE NOTICE '👥 Employees: 10';
    RAISE NOTICE '🏢 Departments: 5';
    RAISE NOTICE '👤 Users: 11';
    RAISE NOTICE '📄 Contracts: 6';
    RAISE NOTICE '📊 Attendances: ~250';
    RAISE NOTICE '💰 Payroll items: 10';
END $$;
