/*
  Warnings:

  - You are about to drop the column `margin_percentage` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit_cost_per_base_unit` on the `raw_materials` table. All the data in the column will be lost.
  - You are about to drop the column `serving_size` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "margin_percentage";

-- AlterTable
ALTER TABLE "raw_materials" DROP COLUMN "unit_cost_per_base_unit",
ADD COLUMN     "cost_per_individual_unit" DECIMAL(12,4);

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "serving_size";
