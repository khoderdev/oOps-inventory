/*
  Warnings:

  - The values [CONDIMENTS] on the enum `material_category` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "material_category_new" AS ENUM ('MEAT', 'VEGETABLES', 'DAIRY', 'BEVERAGES', 'BREAD', 'GRAINS', 'SPICES', 'PACKAGING', 'OTHER');
ALTER TABLE "raw_materials" ALTER COLUMN "category" TYPE "material_category_new" USING ("category"::text::"material_category_new");
ALTER TABLE "budget_allocations" ALTER COLUMN "category" TYPE "material_category_new" USING ("category"::text::"material_category_new");
ALTER TYPE "material_category" RENAME TO "material_category_old";
ALTER TYPE "material_category_new" RENAME TO "material_category";
DROP TYPE "material_category_old";
COMMIT;
