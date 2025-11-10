-- AlterTable
-- Make last_name column nullable in contacts table
-- This allows contacts with single names or unclear name structures
ALTER TABLE "contacts" ALTER COLUMN "last_name" DROP NOT NULL;
