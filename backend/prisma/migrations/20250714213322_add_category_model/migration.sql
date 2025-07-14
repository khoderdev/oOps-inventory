/*
  Warnings:

  - You are about to drop the column `category` on the `budget_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `recipes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[budget_id,category_id]` on the table `budget_allocations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_id` to the `budget_allocations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `menu_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category_id` to the `raw_materials` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "category_type" AS ENUM ('MATERIAL', 'RECIPE', 'MENU_ITEM');

-- DropIndex
DROP INDEX "budget_allocations_budget_id_category_key";

-- DropIndex
DROP INDEX "budget_allocations_category_idx";

-- DropIndex
DROP INDEX "menu_items_category_idx";

-- DropIndex
DROP INDEX "raw_materials_category_idx";

-- DropIndex
DROP INDEX "recipes_category_idx";

-- AlterTable
ALTER TABLE "budget_allocations" DROP COLUMN "category",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "category",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "raw_materials" DROP COLUMN "category",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "category",
ADD COLUMN     "category_id" INTEGER;

-- DropEnum
DROP TYPE "material_category";

-- DropEnum
DROP TYPE "menu_category";

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "category_type" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE INDEX "budget_allocations_category_id_idx" ON "budget_allocations"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_allocations_budget_id_category_id_key" ON "budget_allocations"("budget_id", "category_id");

-- CreateIndex
CREATE INDEX "menu_items_category_id_idx" ON "menu_items"("category_id");

-- CreateIndex
CREATE INDEX "raw_materials_category_id_idx" ON "raw_materials"("category_id");

-- CreateIndex
CREATE INDEX "recipes_category_id_idx" ON "recipes"("category_id");

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
