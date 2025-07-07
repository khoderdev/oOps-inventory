/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_email_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable: Add username column as nullable first
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Update existing records with usernames based on email (taking part before @)
UPDATE "users" 
SET "username" = LOWER(SPLIT_PART("email", '@', 1))
WHERE "username" IS NULL AND "email" IS NOT NULL;

-- For any remaining null usernames, set a default pattern
UPDATE "users" 
SET "username" = 'user_' || "id"
WHERE "username" IS NULL;

-- Make username NOT NULL now that all records have values
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");
