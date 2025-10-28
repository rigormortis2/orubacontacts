-- CreateTable
CREATE TABLE "job_titles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_title_key" ON "job_titles"("title");

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_slug_key" ON "job_titles"("slug");

-- CreateIndex
CREATE INDEX "job_titles_slug_idx" ON "job_titles"("slug");

-- CreateIndex
CREATE INDEX "job_titles_isActive_idx" ON "job_titles"("isActive");
