-- CreateTable
CREATE TABLE "leave_accrual_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "days_added" INTEGER NOT NULL,
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "accrual_type" VARCHAR(50) NOT NULL,
    "triggered_by" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_accrual_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "leave_accrual_history" ADD CONSTRAINT "leave_accrual_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
