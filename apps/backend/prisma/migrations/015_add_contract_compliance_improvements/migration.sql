-- Migration: Add Contract Compliance Improvements
-- Description: Add TerminationRequest and ContractAppendix tables, add notes column to contracts
-- Date: 2026-02-09

-- Add notes column to contracts table (separate from terms)
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Create termination_requests table
CREATE TABLE IF NOT EXISTS "termination_requests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "termination_category" VARCHAR(50) NOT NULL,
    "notice_date" DATE NOT NULL,
    "termination_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approver_id" UUID,
    "approved_at" TIMESTAMP(6),
    "approver_comments" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_termination_contract" FOREIGN KEY ("contract_id") 
        REFERENCES "contracts"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_termination_requester" FOREIGN KEY ("requested_by") 
        REFERENCES "users"("id") ON DELETE RESTRICT,
    CONSTRAINT "fk_termination_approver" FOREIGN KEY ("approver_id") 
        REFERENCES "users"("id") ON DELETE SET NULL
);

-- Create indexes for termination_requests
CREATE INDEX IF NOT EXISTS "idx_termination_requests_contract_id" 
    ON "termination_requests"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_termination_requests_status" 
    ON "termination_requests"("status");
CREATE INDEX IF NOT EXISTS "idx_termination_requests_termination_date" 
    ON "termination_requests"("termination_date");

-- Create contract_appendices table
CREATE TABLE IF NOT EXISTS "contract_appendices" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "contract_id" UUID NOT NULL,
    "appendix_number" VARCHAR(100) NOT NULL,
    "effective_date" DATE NOT NULL,
    "modified_fields" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "fk_appendix_contract" FOREIGN KEY ("contract_id") 
        REFERENCES "contracts"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_appendix_creator" FOREIGN KEY ("created_by") 
        REFERENCES "users"("id") ON DELETE RESTRICT
);

-- Create indexes for contract_appendices
CREATE INDEX IF NOT EXISTS "idx_contract_appendices_contract_id" 
    ON "contract_appendices"("contract_id");
CREATE INDEX IF NOT EXISTS "idx_contract_appendices_effective_date" 
    ON "contract_appendices"("effective_date");

-- Add comments for documentation
COMMENT ON TABLE "termination_requests" IS 'Stores contract termination requests with approval workflow';
COMMENT ON TABLE "contract_appendices" IS 'Stores contract amendments (phụ lục hợp đồng) that modify existing contract terms';
COMMENT ON COLUMN "contracts"."notes" IS 'Internal notes separate from contract terms';
COMMENT ON COLUMN "termination_requests"."termination_category" IS 'Category: RESIGNATION, MUTUAL_AGREEMENT, COMPANY_TERMINATION, CONTRACT_EXPIRATION, DISCIPLINARY';
COMMENT ON COLUMN "termination_requests"."status" IS 'Status: PENDING_APPROVAL, APPROVED, REJECTED';
