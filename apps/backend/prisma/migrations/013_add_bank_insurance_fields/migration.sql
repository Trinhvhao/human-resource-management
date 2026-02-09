-- Add bank and insurance fields to employee_profiles table
ALTER TABLE "employee_profiles" 
ADD COLUMN IF NOT EXISTS "bank_account_holder_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "tax_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "social_insurance_number" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "health_insurance_number" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "dependents" INTEGER DEFAULT 0;

-- Add indexes for search
CREATE INDEX IF NOT EXISTS "idx_employee_profiles_tax_code" ON "employee_profiles"("tax_code");
CREATE INDEX IF NOT EXISTS "idx_employee_profiles_social_insurance" ON "employee_profiles"("social_insurance_number");
CREATE INDEX IF NOT EXISTS "idx_employee_profiles_health_insurance" ON "employee_profiles"("health_insurance_number");
