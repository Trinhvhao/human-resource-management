-- Migration: Add Email Verification
-- Description: Add email verification fields to users table
-- Date: 2026-02-25

-- Add email verification columns to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "email_verification_token" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(6);

-- Create index on email_verification_token for faster lookups
CREATE INDEX IF NOT EXISTS "idx_users_email_verification_token" 
ON "users"("email_verification_token") 
WHERE "email_verification_token" IS NOT NULL;

-- Create index on is_email_verified for filtering
CREATE INDEX IF NOT EXISTS "idx_users_is_email_verified" 
ON "users"("is_email_verified");

-- Add comment to columns
COMMENT ON COLUMN "users"."is_email_verified" IS 'Whether the user has verified their email address';
COMMENT ON COLUMN "users"."email_verification_token" IS 'Token used for email verification (JWT or random string)';
COMMENT ON COLUMN "users"."email_verified_at" IS 'Timestamp when email was verified';
