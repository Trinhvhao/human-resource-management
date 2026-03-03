-- Migration: Add Payroll Workflow
-- Description: Add approval workflow fields to payrolls table
-- Date: 2026-02-25

-- Create PayrollStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'LOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to payrolls table
ALTER TABLE "payrolls" 
ADD COLUMN IF NOT EXISTS "approved_by" UUID,
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "rejected_by" UUID,
ADD COLUMN IF NOT EXISTS "rejected_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "locked_by" UUID,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "previous_version_id" UUID,
ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "submitted_by" UUID;

-- Migrate existing data: FINALIZED -> LOCKED, DRAFT stays DRAFT
UPDATE "payrolls" SET "status" = 'LOCKED' WHERE "status" = 'FINALIZED';

-- Drop existing default first
ALTER TABLE "payrolls" 
ALTER COLUMN "status" DROP DEFAULT;

-- Update status column to use enum
ALTER TABLE "payrolls" 
ALTER COLUMN "status" TYPE "PayrollStatus" USING "status"::"PayrollStatus";

-- Set default status to DRAFT
ALTER TABLE "payrolls" 
ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"PayrollStatus";

-- Add foreign key constraints
ALTER TABLE "payrolls"
ADD CONSTRAINT "fk_payrolls_approved_by" 
FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "payrolls"
ADD CONSTRAINT "fk_payrolls_rejected_by" 
FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "payrolls"
ADD CONSTRAINT "fk_payrolls_locked_by" 
FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "payrolls"
ADD CONSTRAINT "fk_payrolls_submitted_by" 
FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "payrolls"
ADD CONSTRAINT "fk_payrolls_previous_version" 
FOREIGN KEY ("previous_version_id") REFERENCES "payrolls"("id") ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_payrolls_status" ON "payrolls"("status");
CREATE INDEX IF NOT EXISTS "idx_payrolls_approved_by" ON "payrolls"("approved_by");
CREATE INDEX IF NOT EXISTS "idx_payrolls_version" ON "payrolls"("version");
CREATE INDEX IF NOT EXISTS "idx_payrolls_previous_version" ON "payrolls"("previous_version_id");

-- Add comments
COMMENT ON COLUMN "payrolls"."approved_by" IS 'User who approved the payroll';
COMMENT ON COLUMN "payrolls"."approved_at" IS 'Timestamp when payroll was approved';
COMMENT ON COLUMN "payrolls"."rejected_by" IS 'User who rejected the payroll';
COMMENT ON COLUMN "payrolls"."rejected_at" IS 'Timestamp when payroll was rejected';
COMMENT ON COLUMN "payrolls"."rejection_reason" IS 'Reason for rejection';
COMMENT ON COLUMN "payrolls"."locked_at" IS 'Timestamp when payroll was locked (after payment)';
COMMENT ON COLUMN "payrolls"."locked_by" IS 'User who locked the payroll';
COMMENT ON COLUMN "payrolls"."version" IS 'Version number for revision tracking';
COMMENT ON COLUMN "payrolls"."previous_version_id" IS 'Reference to previous version (for revisions)';
COMMENT ON COLUMN "payrolls"."submitted_at" IS 'Timestamp when payroll was submitted for approval';
COMMENT ON COLUMN "payrolls"."submitted_by" IS 'User who submitted the payroll for approval';
