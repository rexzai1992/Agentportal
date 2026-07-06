-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- Seed a default outlet for products that already exist.
INSERT INTO "Outlet" ("id", "name", "code", "description", "active", "createdAt", "updatedAt")
VALUES (
    'default-outlet',
    'Main Outlet',
    'MAIN',
    'Default outlet for existing products',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "TicketType" ADD COLUMN "outletId" TEXT;

UPDATE "TicketType" SET "outletId" = 'default-outlet' WHERE "outletId" IS NULL;

ALTER TABLE "TicketType" ALTER COLUMN "outletId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_code_key" ON "Outlet"("code");

-- CreateIndex
CREATE INDEX "Outlet_active_idx" ON "Outlet"("active");

-- CreateIndex
CREATE INDEX "TicketType_outletId_idx" ON "TicketType"("outletId");

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
