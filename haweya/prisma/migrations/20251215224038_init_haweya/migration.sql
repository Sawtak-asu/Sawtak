-- CreateTable
CREATE TABLE "haweya_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "national_id" TEXT NOT NULL,
    "picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "haweya_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haweya_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haweya_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haweya_auth_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haweya_auth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "haweya_clients" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "client_secret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "redirect_uris" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "haweya_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "haweya_users_email_key" ON "haweya_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "haweya_users_national_id_key" ON "haweya_users"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "haweya_auth_codes_code_key" ON "haweya_auth_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "haweya_clients_client_id_key" ON "haweya_clients"("client_id");

-- AddForeignKey
ALTER TABLE "haweya_sessions" ADD CONSTRAINT "haweya_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "haweya_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "haweya_auth_codes" ADD CONSTRAINT "haweya_auth_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "haweya_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
