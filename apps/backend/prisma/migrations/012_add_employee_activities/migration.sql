-- CreateTable: Employee Activities
CREATE TABLE "employee_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "activity_type" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "performed_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_activities_employee_id_created_at_idx" ON "employee_activities"("employee_id", "created_at" DESC);
CREATE INDEX "employee_activities_activity_type_idx" ON "employee_activities"("activity_type");
CREATE INDEX "employee_activities_created_at_idx" ON "employee_activities"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "employee_activities" ADD CONSTRAINT "employee_activities_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_activities" ADD CONSTRAINT "employee_activities_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
