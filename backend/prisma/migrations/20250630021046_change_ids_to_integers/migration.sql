/*
  Warnings:

  - The primary key for the `order_counters` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `order_counters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `raw_materials` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `raw_materials` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `section_consumptions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `section_consumptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `section_inventories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `section_inventories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `sections` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `sections` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `stock_entries` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `stock_entries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `stock_movements` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `from_section_id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `to_section_id` column on the `stock_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `section_id` on the `section_consumptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `raw_material_id` on the `section_consumptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `consumed_by` on the `section_consumptions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `section_id` on the `section_inventories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `raw_material_id` on the `section_inventories` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `manager_id` on the `sections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `raw_material_id` on the `stock_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `received_by` on the `stock_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `stock_entry_id` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `performed_by` on the `stock_movements` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "section_consumptions" DROP CONSTRAINT "section_consumptions_consumed_by_fkey";

-- DropForeignKey
ALTER TABLE "section_consumptions" DROP CONSTRAINT "section_consumptions_raw_material_id_fkey";

-- DropForeignKey
ALTER TABLE "section_consumptions" DROP CONSTRAINT "section_consumptions_section_id_fkey";

-- DropForeignKey
ALTER TABLE "section_inventories" DROP CONSTRAINT "section_inventories_raw_material_id_fkey";

-- DropForeignKey
ALTER TABLE "section_inventories" DROP CONSTRAINT "section_inventories_section_id_fkey";

-- DropForeignKey
ALTER TABLE "sections" DROP CONSTRAINT "sections_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_raw_material_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_received_by_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_from_section_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_performed_by_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_stock_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_to_section_id_fkey";

-- AlterTable
ALTER TABLE "order_counters" DROP CONSTRAINT "order_counters_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "order_counters_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "raw_materials" DROP CONSTRAINT "raw_materials_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "section_consumptions" DROP CONSTRAINT "section_consumptions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "section_id",
ADD COLUMN     "section_id" INTEGER NOT NULL,
DROP COLUMN "raw_material_id",
ADD COLUMN     "raw_material_id" INTEGER NOT NULL,
DROP COLUMN "consumed_by",
ADD COLUMN     "consumed_by" INTEGER NOT NULL,
ADD CONSTRAINT "section_consumptions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "section_inventories" DROP CONSTRAINT "section_inventories_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "section_id",
ADD COLUMN     "section_id" INTEGER NOT NULL,
DROP COLUMN "raw_material_id",
ADD COLUMN     "raw_material_id" INTEGER NOT NULL,
ADD CONSTRAINT "section_inventories_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sections" DROP CONSTRAINT "sections_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "manager_id",
ADD COLUMN     "manager_id" INTEGER NOT NULL,
ADD CONSTRAINT "sections_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "stock_entries" DROP CONSTRAINT "stock_entries_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "raw_material_id",
ADD COLUMN     "raw_material_id" INTEGER NOT NULL,
DROP COLUMN "received_by",
ADD COLUMN     "received_by" INTEGER NOT NULL,
ADD CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "stock_movements" DROP CONSTRAINT "stock_movements_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "stock_entry_id",
ADD COLUMN     "stock_entry_id" INTEGER NOT NULL,
DROP COLUMN "from_section_id",
ADD COLUMN     "from_section_id" INTEGER,
DROP COLUMN "to_section_id",
ADD COLUMN     "to_section_id" INTEGER,
DROP COLUMN "performed_by",
ADD COLUMN     "performed_by" INTEGER NOT NULL,
ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "section_consumptions_section_id_idx" ON "section_consumptions"("section_id");

-- CreateIndex
CREATE INDEX "section_consumptions_raw_material_id_idx" ON "section_consumptions"("raw_material_id");

-- CreateIndex
CREATE INDEX "section_consumptions_consumed_by_idx" ON "section_consumptions"("consumed_by");

-- CreateIndex
CREATE INDEX "section_inventories_section_id_idx" ON "section_inventories"("section_id");

-- CreateIndex
CREATE INDEX "section_inventories_raw_material_id_idx" ON "section_inventories"("raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_inventories_section_id_raw_material_id_key" ON "section_inventories"("section_id", "raw_material_id");

-- CreateIndex
CREATE INDEX "sections_manager_id_idx" ON "sections"("manager_id");

-- CreateIndex
CREATE INDEX "stock_entries_raw_material_id_idx" ON "stock_entries"("raw_material_id");

-- CreateIndex
CREATE INDEX "stock_entries_received_by_idx" ON "stock_entries"("received_by");

-- CreateIndex
CREATE INDEX "stock_movements_stock_entry_id_idx" ON "stock_movements"("stock_entry_id");

-- CreateIndex
CREATE INDEX "stock_movements_performed_by_idx" ON "stock_movements"("performed_by");

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_inventories" ADD CONSTRAINT "section_inventories_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_inventories" ADD CONSTRAINT "section_inventories_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_consumptions" ADD CONSTRAINT "section_consumptions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_consumptions" ADD CONSTRAINT "section_consumptions_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_consumptions" ADD CONSTRAINT "section_consumptions_consumed_by_fkey" FOREIGN KEY ("consumed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_section_id_fkey" FOREIGN KEY ("from_section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_section_id_fkey" FOREIGN KEY ("to_section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
