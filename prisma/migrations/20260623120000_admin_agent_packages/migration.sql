-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT NOT NULL,
    "category" TEXT,
    "tags" JSONB,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "currentPackageVersionId" TEXT,
    "skillId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentSkillPackage" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "manifest" JSONB,
    "validationStatus" TEXT NOT NULL DEFAULT 'pending',
    "validationErrors" JSONB,
    "releaseNote" TEXT,
    "skillVersionId" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentSkillPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");

-- CreateIndex
CREATE INDEX "Agent_status_updatedAt_idx" ON "Agent"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentSkillPackage_agentId_version_key" ON "AgentSkillPackage"("agentId", "version");

-- CreateIndex
CREATE INDEX "AgentSkillPackage_agentId_createdAt_idx" ON "AgentSkillPackage"("agentId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentSkillPackage" ADD CONSTRAINT "AgentSkillPackage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
