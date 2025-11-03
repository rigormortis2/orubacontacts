-- CreateTable
CREATE TABLE "person_contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "full_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "job_title_id" UUID,
    "hospital_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "person_contacts_job_title_id_idx" ON "person_contacts"("job_title_id");

-- CreateIndex
CREATE INDEX "person_contacts_hospital_id_idx" ON "person_contacts"("hospital_id");

-- CreateIndex
CREATE INDEX "person_contacts_email_idx" ON "person_contacts"("email");

-- CreateIndex
CREATE INDEX "person_contacts_is_active_idx" ON "person_contacts"("is_active");

-- AddForeignKey
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_job_title_id_fkey" FOREIGN KEY ("job_title_id") REFERENCES "job_titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_contacts" ADD CONSTRAINT "person_contacts_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
