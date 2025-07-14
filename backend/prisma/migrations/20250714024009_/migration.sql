/*
  Warnings:

  - A unique constraint covering the columns `[unique_key]` on the table `order_counters` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "recipe_consumptions" DROP CONSTRAINT "recipe_consumptions_consumed_by_fkey";

-- DropForeignKey
ALTER TABLE "recipe_consumptions" DROP CONSTRAINT "recipe_consumptions_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_consumptions" DROP CONSTRAINT "recipe_consumptions_section_id_fkey";

-- AlterTable
ALTER TABLE "order_counters" ADD COLUMN     "unique_key" TEXT NOT NULL DEFAULT 'singleton';

-- CreateIndex
CREATE UNIQUE INDEX "order_counters_unique_key_key" ON "order_counters"("unique_key");

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_consumed_by_fkey" FOREIGN KEY ("consumed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
