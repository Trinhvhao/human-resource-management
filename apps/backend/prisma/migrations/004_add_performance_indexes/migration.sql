-- Add indexes for better query performance

-- Employee indexes
CREATE INDEX IF NOT EXISTS "idx_employee_status" ON "Employee"("status");
CREATE INDEX IF NOT EXISTS "idx_employee_department" ON "Employee"("departmentId");
CREATE INDEX IF NOT EXISTS "idx_employee_code" ON "Employee"("employeeCode");
CREATE INDEX IF NOT EXISTS "idx_employee_email" ON "Employee"("email");

-- Attendance indexes
CREATE INDEX IF NOT EXISTS "idx_attendance_employee_date" ON "Attendance"("employeeId", "date");
CREATE INDEX IF NOT EXISTS "idx_attendance_date" ON "Attendance"("date");
CREATE INDEX IF NOT EXISTS "idx_attendance_status" ON "Attendance"("status");

-- Leave Request indexes
CREATE INDEX IF NOT EXISTS "idx_leave_employee" ON "LeaveRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_leave_status" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_leave_dates" ON "LeaveRequest"("startDate", "endDate");

-- Overtime Request indexes
CREATE INDEX IF NOT EXISTS "idx_overtime_employee" ON "OvertimeRequest"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_overtime_status" ON "OvertimeRequest"("status");
CREATE INDEX IF NOT EXISTS "idx_overtime_date" ON "OvertimeRequest"("date");

-- Payroll indexes
CREATE INDEX IF NOT EXISTS "idx_payroll_month_year" ON "Payroll"("month", "year");
CREATE INDEX IF NOT EXISTS "idx_payroll_status" ON "Payroll"("status");

-- User indexes
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_employee" ON "User"("employeeId");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");

-- Department indexes
CREATE INDEX IF NOT EXISTS "idx_department_parent" ON "Department"("parentId");
CREATE INDEX IF NOT EXISTS "idx_department_manager" ON "Department"("managerId");
