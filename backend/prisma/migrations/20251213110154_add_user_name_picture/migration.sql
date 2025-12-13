-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "picture" TEXT,
    "anonymous_identifier" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "auth_provider" TEXT NOT NULL DEFAULT 'email',
    "auth_provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentifiedComplaint" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "evidence_urls" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "IdentifiedComplaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndexedComplaint" (
    "hcs_hash" TEXT NOT NULL,
    "anonymous_identifier" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "complaint_text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "evidence_cids" JSONB,
    "status" TEXT NOT NULL,
    "consensus_timestamp" TIMESTAMP(3) NOT NULL,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexedComplaint_pkey" PRIMARY KEY ("hcs_hash")
);

-- CreateTable
CREATE TABLE "IndexedStatusUpdate" (
    "hcs_hash" TEXT NOT NULL,
    "complaint_hash" TEXT NOT NULL,
    "old_status" TEXT NOT NULL,
    "new_status" TEXT NOT NULL,
    "public_notes" TEXT,
    "admin_id" TEXT NOT NULL,
    "consensus_timestamp" TIMESTAMP(3) NOT NULL,
    "sequence_number" BIGINT NOT NULL,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexedStatusUpdate_pkey" PRIMARY KEY ("hcs_hash")
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_anonymous_identifier_key" ON "User"("anonymous_identifier");

-- CreateIndex
CREATE INDEX "IndexedComplaint_anonymous_identifier_idx" ON "IndexedComplaint"("anonymous_identifier");

-- CreateIndex
CREATE INDEX "IndexedComplaint_category_idx" ON "IndexedComplaint"("category");

-- CreateIndex
CREATE INDEX "IndexedComplaint_area_idx" ON "IndexedComplaint"("area");

-- CreateIndex
CREATE INDEX "IndexedComplaint_status_idx" ON "IndexedComplaint"("status");

-- CreateIndex
CREATE INDEX "IndexedStatusUpdate_complaint_hash_idx" ON "IndexedStatusUpdate"("complaint_hash");

-- AddForeignKey
ALTER TABLE "IdentifiedComplaint" ADD CONSTRAINT "IdentifiedComplaint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAudit" ADD CONSTRAINT "AdminAudit_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
