-- Migration: Add Leave Accrual History table
-- Date: 2026-01-19

CREATE TABLE IF NOT EXISTS leave_accrual_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    days_added INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    accrual_type VARCHAR(50) NOT NULL,
    triggered_by UUID,
    notes TEXT,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_accrual_history_employee_id ON leave_accrual_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_accrual_history_year_month ON leave_accrual_history(year, month);

COMMENT ON TABLE leave_accrual_history IS 'Lịch sử tích lũy phép năm';
COMMENT ON COLUMN leave_accrual_history.accrual_type IS 'AUTO: Tự động, MANUAL: Thủ công, ADJUSTMENT: Điều chỉnh';
