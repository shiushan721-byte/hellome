-- CreateTable
CREATE TABLE "BillingTopup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenAmount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingTopup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingTopup_userId_createdAt_idx" ON "BillingTopup"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "BillingTopup" ADD CONSTRAINT "BillingTopup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
