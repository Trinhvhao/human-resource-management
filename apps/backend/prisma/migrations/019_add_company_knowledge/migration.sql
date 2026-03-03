-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "company_knowledge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "embedding" vector(384),
    "metadata" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_knowledge_category_idx" ON "company_knowledge"("category");
CREATE INDEX "company_knowledge_is_active_idx" ON "company_knowledge"("is_active");
CREATE INDEX "company_knowledge_created_at_idx" ON "company_knowledge"("created_at");

-- Add vector similarity search index (for pgvector)
-- CREATE INDEX ON company_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
