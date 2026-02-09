-- Add workType and workHoursPerWeek to contracts table
ALTER TABLE "contracts" 
ADD COLUMN "work_type" VARCHAR(20) DEFAULT 'FULL_TIME',
ADD COLUMN "work_hours_per_week" INTEGER DEFAULT 40;

-- Add comment for documentation
COMMENT ON COLUMN "contracts"."work_type" IS 'Employment type: FULL_TIME or PART_TIME';
COMMENT ON COLUMN "contracts"."work_hours_per_week" IS 'Number of working hours per week';

-- Update existing contracts to have proper work_type
UPDATE "contracts" SET "work_type" = 'FULL_TIME', "work_hours_per_week" = 40 WHERE "work_type" IS NULL;
