-- AlterTable
ALTER TABLE "HermesExecution" ADD COLUMN IF NOT EXISTS "skillId" TEXT,
ADD COLUMN IF NOT EXISTS "skillVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "skillChecksum" TEXT,
ADD COLUMN IF NOT EXISTS "deviceId" TEXT,
ADD COLUMN IF NOT EXISTS "grantId" TEXT;

-- AlterTable
ALTER TABLE "SkillVersion" ADD COLUMN IF NOT EXISTS "checksum" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
ADD COLUMN IF NOT EXISTS "baseVersionId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "skillId" TEXT,
ADD COLUMN IF NOT EXISTS "skillVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "executionGrantId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExecutionGrant" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "skillVersionId" TEXT NOT NULL,
    "deviceId" TEXT,
    "grantTokenHash" TEXT NOT NULL,
    "allowedProviders" JSONB,
    "allowedModels" JSONB,
    "tokenBudgetMax" INTEGER NOT NULL DEFAULT 30000,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExecutionGrant_taskId_createdAt_idx" ON "ExecutionGrant"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExecutionGrant_grantTokenHash_idx" ON "ExecutionGrant"("grantTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Task_executionGrantId_key" ON "Task"("executionGrantId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_skillVersionId_fkey" FOREIGN KEY ("skillVersionId") REFERENCES "SkillVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_executionGrantId_fkey" FOREIGN KEY ("executionGrantId") REFERENCES "ExecutionGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExecutionGrant" ADD CONSTRAINT "ExecutionGrant_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExecutionGrant" ADD CONSTRAINT "ExecutionGrant_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExecutionGrant" ADD CONSTRAINT "ExecutionGrant_skillVersionId_fkey" FOREIGN KEY ("skillVersionId") REFERENCES "SkillVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ExecutionGrant" ADD CONSTRAINT "ExecutionGrant_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "HermesDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
