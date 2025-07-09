/*
  Warnings:

  - You are about to alter the column `allocated_amount` on the `budget_allocations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `spent_amount` on the `budget_allocations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `total_budget` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `allocated_amount` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `spent_amount` on the `budgets` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,5)`.
  - You are about to alter the column `cost_price` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `selling_price` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `margin_amount` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `unit_cost` on the `purchase_order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `line_total` on the `purchase_order_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `total_amount` on the `purchase_orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `unit_cost` on the `raw_materials` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `cost_per_base_unit` on the `raw_materials` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `cost_per_individual_unit` on the `raw_materials` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,4)` to `Decimal(12,5)`.
  - You are about to alter the column `cost_per_unit` on the `recipe_ingredients` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `cost_per_serving` on the `recipes` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `unit_price` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.
  - You are about to alter the column `total_amount` on the `sales` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(10,5)`.

*/
-- AlterTable
ALTER TABLE "budget_allocations" ALTER COLUMN "allocated_amount" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "spent_amount" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "budgets" ALTER COLUMN "total_budget" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "allocated_amount" SET DATA TYPE DECIMAL(12,5),
ALTER COLUMN "spent_amount" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "menu_items" ALTER COLUMN "cost_price" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "selling_price" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "margin_amount" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "purchase_order_items" ALTER COLUMN "unit_cost" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "line_total" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "raw_materials" ALTER COLUMN "unit_cost" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "cost_per_base_unit" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "cost_per_individual_unit" SET DATA TYPE DECIMAL(12,5);

-- AlterTable
ALTER TABLE "recipe_ingredients" ALTER COLUMN "cost_per_unit" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "cost_per_serving" SET DATA TYPE DECIMAL(10,5);

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "unit_price" SET DATA TYPE DECIMAL(10,5),
ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(10,5);
