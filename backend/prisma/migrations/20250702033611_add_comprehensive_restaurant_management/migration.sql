-- CreateEnum
CREATE TYPE "purchase_order_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "menu_category" AS ENUM ('APPETIZER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SIDE_DISH', 'SALAD', 'SOUP', 'SPECIAL', 'BREAKFAST', 'LUNCH', 'DINNER');

-- CreateEnum
CREATE TYPE "budget_period" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "contract_status" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'OVERDUE', 'CANCELLED', 'DISPUTED');

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT DEFAULT 'USA',
    "tax_id" TEXT,
    "payment_terms" INTEGER NOT NULL DEFAULT 30,
    "discount_rate" DECIMAL(5,2),
    "credit_limit" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rating" INTEGER DEFAULT 5,
    "lead_time_days" INTEGER NOT NULL DEFAULT 7,
    "minimum_order" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_materials" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "raw_material_id" INTEGER NOT NULL,
    "supplier_sku" TEXT,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "minimum_quantity" DECIMAL(10,2) NOT NULL,
    "lead_time_days" INTEGER NOT NULL DEFAULT 7,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "last_price_update" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "status" "purchase_order_status" NOT NULL DEFAULT 'DRAFT',
    "order_date" TIMESTAMP(3) NOT NULL,
    "expected_date" TIMESTAMP(3) NOT NULL,
    "received_date" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "approved_by" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL,
    "purchase_order_id" INTEGER NOT NULL,
    "raw_material_id" INTEGER NOT NULL,
    "quantity_ordered" DECIMAL(10,2) NOT NULL,
    "quantity_received" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_receipts" (
    "id" SERIAL NOT NULL,
    "purchase_order_id" INTEGER NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "received_by" INTEGER NOT NULL,
    "notes" TEXT,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "serving_size" INTEGER NOT NULL DEFAULT 1,
    "prep_time" INTEGER,
    "cook_time" INTEGER,
    "instructions" TEXT,
    "cost_per_serving" DECIMAL(10,2),
    "margin_percentage" DECIMAL(5,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "raw_material_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" "measurement_unit" NOT NULL,
    "cost_per_unit" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "menu_category" NOT NULL,
    "recipe_id" INTEGER,
    "cost_price" DECIMAL(10,2) NOT NULL,
    "selling_price" DECIMAL(10,2) NOT NULL,
    "margin_amount" DECIMAL(10,2) NOT NULL,
    "margin_percentage" DECIMAL(5,2) NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "allergens" TEXT,
    "nutritional_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "section_id" INTEGER,
    "served_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "period_type" "budget_period" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_budget" DECIMAL(12,2) NOT NULL,
    "allocated_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "category" "material_category" NOT NULL,
    "allocated_amount" DECIMAL(10,2) NOT NULL,
    "spent_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_contracts" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "contract_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "payment_terms" INTEGER NOT NULL,
    "discount_rate" DECIMAL(5,2),
    "minimum_order" DECIMAL(10,2),
    "maximum_order" DECIMAL(10,2),
    "price_lock" BOOLEAN NOT NULL DEFAULT false,
    "auto_renewal" BOOLEAN NOT NULL DEFAULT false,
    "status" "contract_status" NOT NULL DEFAULT 'ACTIVE',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_invoices" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "purchase_order_id" INTEGER,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "payment_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "suppliers_rating_idx" ON "suppliers"("rating");

-- CreateIndex
CREATE INDEX "supplier_materials_supplier_id_idx" ON "supplier_materials"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_materials_raw_material_id_idx" ON "supplier_materials"("raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_materials_supplier_id_raw_material_id_key" ON "supplier_materials"("supplier_id", "raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_order_date_idx" ON "purchase_orders"("order_date");

-- CreateIndex
CREATE INDEX "purchase_orders_created_by_idx" ON "purchase_orders"("created_by");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchase_order_id_idx" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_raw_material_id_idx" ON "purchase_order_items"("raw_material_id");

-- CreateIndex
CREATE INDEX "purchase_receipts_purchase_order_id_idx" ON "purchase_receipts"("purchase_order_id");

-- CreateIndex
CREATE INDEX "purchase_receipts_received_date_idx" ON "purchase_receipts"("received_date");

-- CreateIndex
CREATE INDEX "recipes_category_idx" ON "recipes"("category");

-- CreateIndex
CREATE INDEX "recipes_is_active_idx" ON "recipes"("is_active");

-- CreateIndex
CREATE INDEX "recipes_created_by_idx" ON "recipes"("created_by");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_raw_material_id_idx" ON "recipe_ingredients"("raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipe_id_raw_material_id_key" ON "recipe_ingredients"("recipe_id", "raw_material_id");

-- CreateIndex
CREATE INDEX "menu_items_category_idx" ON "menu_items"("category");

-- CreateIndex
CREATE INDEX "menu_items_is_available_idx" ON "menu_items"("is_available");

-- CreateIndex
CREATE INDEX "menu_items_recipe_id_idx" ON "menu_items"("recipe_id");

-- CreateIndex
CREATE INDEX "sales_sale_date_idx" ON "sales"("sale_date");

-- CreateIndex
CREATE INDEX "sales_menu_item_id_idx" ON "sales"("menu_item_id");

-- CreateIndex
CREATE INDEX "sales_section_id_idx" ON "sales"("section_id");

-- CreateIndex
CREATE INDEX "budgets_period_type_idx" ON "budgets"("period_type");

-- CreateIndex
CREATE INDEX "budgets_start_date_end_date_idx" ON "budgets"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "budgets_is_active_idx" ON "budgets"("is_active");

-- CreateIndex
CREATE INDEX "budget_allocations_budget_id_idx" ON "budget_allocations"("budget_id");

-- CreateIndex
CREATE INDEX "budget_allocations_category_idx" ON "budget_allocations"("category");

-- CreateIndex
CREATE UNIQUE INDEX "budget_allocations_budget_id_category_key" ON "budget_allocations"("budget_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_contracts_contract_number_key" ON "vendor_contracts"("contract_number");

-- CreateIndex
CREATE INDEX "vendor_contracts_supplier_id_idx" ON "vendor_contracts"("supplier_id");

-- CreateIndex
CREATE INDEX "vendor_contracts_status_idx" ON "vendor_contracts"("status");

-- CreateIndex
CREATE INDEX "vendor_contracts_start_date_end_date_idx" ON "vendor_contracts"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "supplier_invoices_supplier_id_idx" ON "supplier_invoices"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_invoices_status_idx" ON "supplier_invoices"("status");

-- CreateIndex
CREATE INDEX "supplier_invoices_invoice_date_idx" ON "supplier_invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "supplier_invoices_due_date_idx" ON "supplier_invoices"("due_date");

-- AddForeignKey
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_materials" ADD CONSTRAINT "supplier_materials_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_served_by_fkey" FOREIGN KEY ("served_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_contracts" ADD CONSTRAINT "vendor_contracts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
