-- AlterTable
ALTER TABLE "IdentifiedComplaint" ADD COLUMN     "directed_to" JSONB;

-- AlterTable
ALTER TABLE "IndexedComplaint" ADD COLUMN     "directed_to" JSONB;

-- CreateIndex
CREATE INDEX "IdentifiedComplaint_directed_to_idx" ON "IdentifiedComplaint"("directed_to");

-- CreateIndex
CREATE INDEX "IdentifiedComplaint_category_idx" ON "IdentifiedComplaint"("category");

-- CreateIndex
CREATE INDEX "IndexedComplaint_directed_to_idx" ON "IndexedComplaint"("directed_to");
