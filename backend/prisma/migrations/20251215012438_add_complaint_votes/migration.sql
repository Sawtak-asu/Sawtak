-- CreateTable
CREATE TABLE "ComplaintVote" (
    "id" TEXT NOT NULL,
    "complaint_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplaintVote_complaint_id_idx" ON "ComplaintVote"("complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintVote_complaint_id_voter_id_key" ON "ComplaintVote"("complaint_id", "voter_id");

-- AddForeignKey
ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "IdentifiedComplaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
