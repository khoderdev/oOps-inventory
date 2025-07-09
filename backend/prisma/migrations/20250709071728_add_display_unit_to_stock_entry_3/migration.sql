/*
  Warnings:

  - You are about to alter the column `unit_cost` on the `stock_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,6)`.
  - You are about to alter the column `total_cost` on the `stock_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,6)`.

*/
-- AlterTable
ALTER TABLE "stock_entries" ALTER COLUMN "unit_cost" SET DATA TYPE DECIMAL(10,6),
ALTER COLUMN "total_cost" SET DATA TYPE DECIMAL(10,6);
