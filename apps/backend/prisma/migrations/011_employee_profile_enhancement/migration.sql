-- =====================================================
-- MIGRATION 011: EMPLOYEE PROFILE ENHANCEMENT
-- Description: Add employee profiles and documents management
-- Date: 2026-02-06
-- =====================================================

-- =====================================================
-- EMPLOYEE PROFILES TABLE (Extended Information)
-- =====================================================
CREATE TABLE employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Personal Information
  place_of_birth VARCHAR(255),
  nationality VARCHAR(100) DEFAULT 'Việt Nam',
  ethnicity VARCHAR(100),
  religion VARCHAR(100),
  marital_status VARCHAR(50), -- SINGLE, MARRIED, DIVORCED, WIDOWED
  number_of_children INT DEFAULT 0,
  
  -- Address Details
  permanent_address TEXT,
  temporary_address TEXT,
  
  -- Government IDs
  social_insurance_number VARCHAR(50) UNIQUE,
  tax_code VARCHAR(50) UNIQUE,
  passport_number VARCHAR(50),
  passport_expiry DATE,
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_relationship VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_address TEXT,
  
  -- Education
  highest_education VARCHAR(100), -- HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, PHD
  major VARCHAR(255),
  university VARCHAR(255),
  graduation_year INT,
  professional_certificates TEXT, -- JSON array: [{name, issuer, year}]
  
  -- Bank Information
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_branch VARCHAR(255),
  
  -- Work Experience (before joining company)
  work_experience JSONB, -- [{company, position, startDate, endDate, description}]
  
  -- Metadata
  profile_completion_percentage INT DEFAULT 0,
  last_profile_update TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_children CHECK (number_of_children >= 0),
  CONSTRAINT check_completion CHECK (profile_completion_percentage BETWEEN 0 AND 100),
  CONSTRAINT check_graduation_year CHECK (graduation_year IS NULL OR (graduation_year >= 1950 AND graduation_year <= 2100))
);

CREATE INDEX idx_employee_profiles_employee_id ON employee_profiles(employee_id);
CREATE INDEX idx_employee_profiles_social_insurance ON employee_profiles(social_insurance_number) WHERE social_insurance_number IS NOT NULL;
CREATE INDEX idx_employee_profiles_tax_code ON employee_profiles(tax_code) WHERE tax_code IS NOT NULL;

COMMENT ON TABLE employee_profiles IS 'Extended employee profile information';
COMMENT ON COLUMN employee_profiles.work_experience IS 'JSON array of previous work experience: [{company, position, startDate, endDate, description}]';
COMMENT ON COLUMN employee_profiles.professional_certificates IS 'JSON array of certificates: [{name, issuer, year, expiryDate}]';

-- =====================================================
-- EMPLOYEE DOCUMENTS TABLE (File Management)
-- =====================================================
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  document_type VARCHAR(50) NOT NULL, -- AVATAR, RESUME, ID_CARD_FRONT, ID_CARD_BACK, DEGREE, CERTIFICATE, CONTRACT, OTHER
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT, -- bytes
  mime_type VARCHAR(100),
  
  description TEXT,
  
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT check_file_size CHECK (file_size IS NULL OR file_size > 0)
);

CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_type ON employee_documents(document_type);
CREATE INDEX idx_employee_documents_uploaded_at ON employee_documents(uploaded_at DESC);

COMMENT ON TABLE employee_documents IS 'Employee document and file management';
COMMENT ON COLUMN employee_documents.document_type IS 'Type: AVATAR, RESUME, ID_CARD_FRONT, ID_CARD_BACK, DEGREE, CERTIFICATE, CONTRACT, OTHER';

-- =====================================================
-- UPDATE EMPLOYEES TABLE (Minimal changes)
-- =====================================================
ALTER TABLE employees ADD COLUMN has_complete_profile BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN profile_last_updated TIMESTAMP;

CREATE INDEX idx_employees_profile_completion ON employees(has_complete_profile) WHERE has_complete_profile = TRUE;

COMMENT ON COLUMN employees.has_complete_profile IS 'Quick indicator if profile is complete (>= 80%)';
COMMENT ON COLUMN employees.profile_last_updated IS 'Last time profile was updated';

-- =====================================================
-- TRIGGER: Auto-create profile when employee created
-- =====================================================
CREATE OR REPLACE FUNCTION create_employee_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_profiles (employee_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_employee_profile
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION create_employee_profile();

COMMENT ON FUNCTION create_employee_profile() IS 'Auto-create employee profile when new employee is created';

-- =====================================================
-- FUNCTION: Calculate profile completion percentage
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_profile_completion(emp_id UUID)
RETURNS INT AS $$
DECLARE
  completion INT := 0;
  profile_record RECORD;
  doc_count INT;
BEGIN
  -- Get profile record
  SELECT * INTO profile_record FROM employee_profiles WHERE employee_id = emp_id;
  
  IF profile_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Personal Info (20%)
  IF profile_record.place_of_birth IS NOT NULL 
     AND profile_record.nationality IS NOT NULL 
     AND profile_record.marital_status IS NOT NULL THEN
    completion := completion + 20;
  END IF;
  
  -- Emergency Contact (20%)
  IF profile_record.emergency_contact_name IS NOT NULL 
     AND profile_record.emergency_contact_phone IS NOT NULL 
     AND profile_record.emergency_contact_relationship IS NOT NULL THEN
    completion := completion + 20;
  END IF;
  
  -- Education (20%)
  IF profile_record.highest_education IS NOT NULL 
     AND profile_record.major IS NOT NULL 
     AND profile_record.university IS NOT NULL THEN
    completion := completion + 20;
  END IF;
  
  -- Bank Info (20%)
  IF profile_record.bank_name IS NOT NULL 
     AND profile_record.bank_account_number IS NOT NULL 
     AND profile_record.bank_branch IS NOT NULL THEN
    completion := completion + 20;
  END IF;
  
  -- Documents (20%) - Check for essential documents
  SELECT COUNT(*) INTO doc_count 
  FROM employee_documents 
  WHERE employee_id = emp_id 
    AND document_type IN ('RESUME', 'ID_CARD_FRONT');
  
  IF doc_count >= 2 THEN
    completion := completion + 20;
  END IF;
  
  RETURN completion;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_profile_completion(UUID) IS 'Calculate profile completion percentage based on 5 groups (20% each)';

-- =====================================================
-- TRIGGER: Update profile completion on profile change
-- =====================================================
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
BEGIN
  -- Calculate new completion percentage
  new_completion := calculate_profile_completion(NEW.employee_id);
  
  -- Update profile
  NEW.profile_completion_percentage := new_completion;
  NEW.last_profile_update := NOW();
  
  -- Update employee table
  UPDATE employees 
  SET 
    has_complete_profile = (new_completion >= 80),
    profile_last_updated = NOW()
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_completion
BEFORE UPDATE ON employee_profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_completion();

COMMENT ON FUNCTION update_profile_completion() IS 'Auto-update profile completion percentage when profile is updated';

-- =====================================================
-- TRIGGER: Update completion when document added/removed
-- =====================================================
CREATE OR REPLACE FUNCTION update_completion_on_document_change()
RETURNS TRIGGER AS $$
DECLARE
  new_completion INT;
  emp_id UUID;
BEGIN
  -- Get employee_id from OLD or NEW
  IF TG_OP = 'DELETE' THEN
    emp_id := OLD.employee_id;
  ELSE
    emp_id := NEW.employee_id;
  END IF;
  
  -- Calculate new completion
  new_completion := calculate_profile_completion(emp_id);
  
  -- Update profile
  UPDATE employee_profiles
  SET 
    profile_completion_percentage = new_completion,
    last_profile_update = NOW()
  WHERE employee_id = emp_id;
  
  -- Update employee table
  UPDATE employees
  SET 
    has_complete_profile = (new_completion >= 80),
    profile_last_updated = NOW()
  WHERE id = emp_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_completion_insert
AFTER INSERT ON employee_documents
FOR EACH ROW
EXECUTE FUNCTION update_completion_on_document_change();

CREATE TRIGGER trigger_document_completion_delete
AFTER DELETE ON employee_documents
FOR EACH ROW
EXECUTE FUNCTION update_completion_on_document_change();

COMMENT ON FUNCTION update_completion_on_document_change() IS 'Update profile completion when documents are added or removed';

-- =====================================================
-- CREATE PROFILES FOR EXISTING EMPLOYEES
-- =====================================================
INSERT INTO employee_profiles (employee_id)
SELECT id FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM employee_profiles WHERE employee_id = employees.id
);

-- =====================================================
-- INITIAL COMPLETION CALCULATION FOR EXISTING EMPLOYEES
-- =====================================================
DO $$
DECLARE
  emp RECORD;
  completion INT;
BEGIN
  FOR emp IN SELECT id FROM employees LOOP
    completion := calculate_profile_completion(emp.id);
    
    UPDATE employee_profiles
    SET profile_completion_percentage = completion
    WHERE employee_id = emp.id;
    
    UPDATE employees
    SET has_complete_profile = (completion >= 80)
    WHERE id = emp.id;
  END LOOP;
END $$;

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON employee_profiles TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON employee_documents TO your_app_user;
