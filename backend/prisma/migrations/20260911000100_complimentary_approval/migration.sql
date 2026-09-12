ALTER TABLE "ComplimentaryGrant"
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ADD COLUMN "requestedItems" JSONB,
  ADD COLUMN "reviewedByUserId" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewRemarks" TEXT;
