-- Migration: Add Department Management System
-- Tables: DepartmentChangeRequest, DepartmentHistory, ManagerTransition

-- 1. Department Change Request Table
CREATE TABLE department_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- CHANGE_MANAGER, CHANGE_PARENT, RESTRUCTURE
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Old values (snapshot)
  old_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  old_parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  old_data JSONB,
  
  -- New values (proposed)
  new_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  new_parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  new_data JSONB,
  
  -- Request details
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
  
  -- Review details
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP(6),
  review_note TEXT,
  
  -- Effective date
  effective_date TIMESTAMP(6) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_request_type CHECK (request_type IN ('CHANGE_MANAGER', 'CHANGE_PARENT', 'RESTRUCTURE')),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
);

-- 2. Department History Table (Audit Log)
CREATE TABLE department_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL, -- CREATED, UPDATED, MANAGER_CHANGED, PARENT_CHANGED, DELETED
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Change details
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_change_type CHECK (change_type IN ('CREATED', 'UPDATED', 'MANAGER_CHANGED', 'PARENT_CHANGED', 'DELETED', 'ACTIVATED', 'DEACTIVATED'))
);

-- 3. Manager Transition Table
CREATE TABLE manager_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  change_request_id UUID REFERENCES department_change_requests(id) ON DELETE SET NULL,
  
  -- Managers
  old_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  new_manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'INITIATED', -- INITIATED, IN_PROGRESS, COMPLETED, CANCELLED
  
  -- Handover tasks
  handover_tasks JSONB DEFAULT '[]'::jsonb,
  completed_tasks JSONB DEFAULT '[]'::jsonb,
  progress_percentage INT DEFAULT 0,
  
  -- Dates
  start_date TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  target_end_date TIMESTAMP(6) NOT NULL,
  actual_end_date TIMESTAMP(6),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_transition_status CHECK (status IN ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT valid_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Indexes for performance
CREATE INDEX idx_change_requests_department ON department_change_requests(department_id);
CREATE INDEX idx_change_requests_status ON department_change_requests(status);
CREATE INDEX idx_change_requests_requested_by ON department_change_requests(requested_by);
CREATE INDEX idx_change_requests_effective_date ON department_change_requests(effective_date);

CREATE INDEX idx_department_history_department ON department_history(department_id);
CREATE INDEX idx_department_history_change_type ON department_history(change_type);
CREATE INDEX idx_department_history_changed_by ON department_history(changed_by);
CREATE INDEX idx_department_history_created_at ON department_history(created_at DESC);

CREATE INDEX idx_manager_transitions_department ON manager_transitions(department_id);
CREATE INDEX idx_manager_transitions_status ON manager_transitions(status);
CREATE INDEX idx_manager_transitions_new_manager ON manager_transitions(new_manager_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON department_change_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manager_transitions_updated_at BEFORE UPDATE ON manager_transitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE department_change_requests IS 'Stores requests for department changes requiring approval';
COMMENT ON TABLE department_history IS 'Audit log for all department changes';
COMMENT ON TABLE manager_transitions IS 'Tracks manager handover process';
