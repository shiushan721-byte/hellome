-- CreateEnum
CREATE TYPE "GnomicBindingStatus" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "GnomicAccountBinding" (
    "id" TEXT NOT NULL,
    "hellomeUserId" TEXT NOT NULL,
    "gnomicUserId" TEXT NOT NULL,
    "phone" TEXT,
    "status" "GnomicBindingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GnomicAccountBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GnomicSsoTicket" (
    "id" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "hellomeUserId" TEXT NOT NULL,
    "gnomicUserId" TEXT NOT NULL,
    "redirectPath" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GnomicSsoTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GnomicAccountBinding_hellomeUserId_key" ON "GnomicAccountBinding"("hellomeUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GnomicAccountBinding_gnomicUserId_key" ON "GnomicAccountBinding"("gnomicUserId");

-- CreateIndex
CREATE INDEX "GnomicAccountBinding_phone_idx" ON "GnomicAccountBinding"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "GnomicSsoTicket_ticket_key" ON "GnomicSsoTicket"("ticket");

-- CreateIndex
CREATE INDEX "GnomicSsoTicket_hellomeUserId_idx" ON "GnomicSsoTicket"("hellomeUserId");

-- CreateIndex
CREATE INDEX "GnomicSsoTicket_expiresAt_idx" ON "GnomicSsoTicket"("expiresAt");
