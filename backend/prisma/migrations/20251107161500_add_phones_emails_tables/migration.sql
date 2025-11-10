-- CreateTable
CREATE TABLE "phones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" TEXT NOT NULL,
    "raw_data_id" UUID NOT NULL,
    "trello_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email_address" TEXT NOT NULL,
    "raw_data_id" UUID NOT NULL,
    "trello_title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phones_raw_data_id_idx" ON "phones"("raw_data_id");

-- CreateIndex
CREATE INDEX "phones_phone_number_idx" ON "phones"("phone_number");

-- CreateIndex
CREATE INDEX "emails_raw_data_id_idx" ON "emails"("raw_data_id");

-- CreateIndex
CREATE INDEX "emails_email_address_idx" ON "emails"("email_address");

-- AddForeignKey
ALTER TABLE "phones" ADD CONSTRAINT "phones_raw_data_id_fkey" FOREIGN KEY ("raw_data_id") REFERENCES "trello_raw_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_raw_data_id_fkey" FOREIGN KEY ("raw_data_id") REFERENCES "trello_raw_datas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
