-- AlterTable
ALTER TABLE "IndexedComplaint" ADD COLUMN     "tracking_hash" TEXT;

-- CreateIndex
CREATE INDEX "IndexedComplaint_tracking_hash_idx" ON "IndexedComplaint"("tracking_hash");
