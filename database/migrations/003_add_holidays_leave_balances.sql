-- Migration: Add holidays and leave_balances tables
-- Date: 2026-01-15

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  year INT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_holiday_date UNIQUE (date)
);

CREATE INDEX idx_holidays_year ON holidays(year);
CREATE INDEX idx_holidays_date ON holidays(date);

-- Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INT NOT NULL,
  annual_leave INT DEFAULT 12,
  sick_leave INT DEFAULT 30,
  used_annual INT DEFAULT 0,
  used_sick INT DEFAULT 0,
  carried_over INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_employee_year UNIQUE (employee_id, year)
);

CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);

-- Insert Vietnamese holidays for 2026
INSERT INTO holidays (name, date, year, is_recurring) VALUES
('Tết Dương lịch', '2026-01-01', 2026, true),
('Tết Nguyên Đán (30 Tết)', '2026-02-16', 2026, false),
('Tết Nguyên Đán (Mùng 1)', '2026-02-17', 2026, false),
('Tết Nguyên Đán (Mùng 2)', '2026-02-18', 2026, false),
('Tết Nguyên Đán (Mùng 3)', '2026-02-19', 2026, false),
('Tết Nguyên Đán (Mùng 4)', '2026-02-20', 2026, false),
('Giỗ Tổ Hùng Vương', '2026-04-02', 2026, false),
('Giải phóng miền Nam', '2026-04-30', 2026, true),
('Quốc tế Lao động', '2026-05-01', 2026, true),
('Quốc khánh', '2026-09-02', 2026, true)
ON CONFLICT (date) DO NOTHING;

-- Initialize leave balances for all active employees for 2026
INSERT INTO leave_balances (employee_id, year, annual_leave, sick_leave, used_annual, used_sick, carried_over)
SELECT 
  id,
  2026,
  12,
  30,
  0,
  0,
  0
FROM employees
WHERE status = 'ACTIVE'
ON CONFLICT (employee_id, year) DO NOTHING;

COMMENT ON TABLE holidays IS 'Quản lý ngày lễ, nghỉ để tính công chính xác';
COMMENT ON TABLE leave_balances IS 'Quản lý số ngày phép còn lại của nhân viên';
