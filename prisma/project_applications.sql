-- One-time DDL for project submissions (/projects/submit).
-- Apply to the same PostgreSQL database as litecoin-fund, or use: npx prisma db push (from litecoin-fund)

CREATE TABLE IF NOT EXISTS "project_applications" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "project_name" TEXT NOT NULL,
    "applicant_email" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "project_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "project_applications_status_idx" ON "project_applications"("status");
CREATE INDEX IF NOT EXISTS "project_applications_created_at_idx" ON "project_applications"("created_at");
