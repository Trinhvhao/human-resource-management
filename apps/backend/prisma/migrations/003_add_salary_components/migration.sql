-- CreateTable
CREATE TABLE "salary_components" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "component_type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "effective_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "salary_components_employee_id_idx" ON "salary_components"("employee_id");
CREATE INDEX "salary_components_component_type_idx" ON "salary_components"("component_type");
CREATE INDEX "salary_components_is_active_idx" ON "salary_components"("is_active");

-- AddForeignKey
ALTER TABLE "salary_components" ADD CONSTRAINT "salary_components_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
