-- CreateTable
CREATE TABLE "job_titles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_title_key" ON "job_titles"("title");

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_slug_key" ON "job_titles"("slug");

-- CreateIndex
CREATE INDEX "job_titles_slug_idx" ON "job_titles"("slug");

-- CreateIndex
CREATE INDEX "job_titles_is_active_idx" ON "job_titles"("is_active");
