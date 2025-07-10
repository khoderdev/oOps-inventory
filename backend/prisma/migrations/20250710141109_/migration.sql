/*
  Warnings:

  - You are about to drop the column `cost_per_serving` on the `recipes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "cost_per_serving",
ADD COLUMN     "serving_cost" DECIMAL(10,5);
