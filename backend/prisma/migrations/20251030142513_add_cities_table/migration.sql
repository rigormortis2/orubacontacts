-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plate_code" INTEGER,
    "region" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_slug_idx" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_plate_code_idx" ON "cities"("plate_code");

-- CreateIndex
CREATE INDEX "cities_is_active_idx" ON "cities"("is_active");

-- AlterTable: Add city_id column (nullable for now, will be populated during data migration)
ALTER TABLE "hospitals" ADD COLUMN "city_id" UUID;

-- CreateIndex on city_id
CREATE INDEX "hospitals_city_id_idx" ON "hospitals"("city_id");

-- Note: We are keeping the 'il' column temporarily for data migration
-- The 'il' column will be dropped in a future migration after city_id is populated
-- The unique constraint hospitals_hastaneAdi_il_key will be replaced with hospitals_hastaneAdi_city_id_key after migration
