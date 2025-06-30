-- CreateEnum
CREATE TYPE "role" AS ENUM ('MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "material_category" AS ENUM ('MEAT', 'VEGETABLES', 'DAIRY', 'BEVERAGES', 'CONDIMENTS', 'GRAINS', 'SPICES', 'PACKAGING', 'OTHER');

-- CreateEnum
CREATE TYPE "measurement_unit" AS ENUM ('KG', 'GRAMS', 'LITERS', 'ML', 'PIECES', 'PACKS', 'BOXES', 'BOTTLES');

-- CreateEnum
CREATE TYPE "section_type" AS ENUM ('KITCHEN', 'BAR', 'STORAGE', 'PREPARATION', 'OTHER');

-- CreateEnum
CREATE TYPE "movement_type" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "role" NOT NULL DEFAULT 'STAFF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "material_category" NOT NULL,
    "unit" "measurement_unit" NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "min_stock_level" DECIMAL(10,2) NOT NULL,
    "max_stock_level" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "units_per_pack" INTEGER,
    "base_unit" "measurement_unit",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "section_type" NOT NULL,
    "manager_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_inventories" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "reserved_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_level" DECIMAL(10,2),
    "max_level" DECIMAL(10,2),
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_consumptions" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "consumed_date" TIMESTAMP(3) NOT NULL,
    "consumed_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "order_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_entries" (
    "id" TEXT NOT NULL,
    "raw_material_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "supplier" TEXT,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3) NOT NULL,
    "received_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "stock_entry_id" TEXT NOT NULL,
    "type" "movement_type" NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "from_section_id" TEXT,
    "to_section_id" TEXT,
    "reason" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "raw_materials_category_idx" ON "raw_materials"("category");

-- CreateIndex
CREATE INDEX "raw_materials_is_active_idx" ON "raw_materials"("is_active");

-- CreateIndex
CREATE INDEX "sections_manager_id_idx" ON "sections"("manager_id");

-- CreateIndex
CREATE INDEX "sections_type_idx" ON "sections"("type");

-- CreateIndex
CREATE INDEX "sections_is_active_idx" ON "sections"("is_active");

-- CreateIndex
CREATE INDEX "section_inventories_section_id_idx" ON "section_inventories"("section_id");

-- CreateIndex
CREATE INDEX "section_inventories_raw_material_id_idx" ON "section_inventories"("raw_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_inventories_section_id_raw_material_id_key" ON "section_inventories"("section_id", "raw_material_id");

-- CreateIndex
CREATE INDEX "section_consumptions_section_id_idx" ON "section_consumptions"("section_id");

-- CreateIndex
CREATE INDEX "section_consumptions_raw_material_id_idx" ON "section_consumptions"("raw_material_id");

-- CreateIndex
CREATE INDEX "section_consumptions_consumed_date_idx" ON "section_consumptions"("consumed_date");

-- CreateIndex
CREATE INDEX "section_consumptions_consumed_by_idx" ON "section_consumptions"("consumed_by");

-- CreateIndex
CREATE INDEX "stock_entries_raw_material_id_idx" ON "stock_entries"("raw_material_id");

-- CreateIndex
CREATE INDEX "stock_entries_received_date_idx" ON "stock_entries"("received_date");

-- CreateIndex
CREATE INDEX "stock_entries_expiry_date_idx" ON "stock_entries"("expiry_date");

-- CreateIndex
CREATE INDEX "stock_entries_received_by_idx" ON "stock_entries"("received_by");

-- CreateIndex
CREATE INDEX "stock_movements_stock_entry_id_idx" ON "stock_movements"("stock_entry_id");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_performed_by_idx" ON "stock_movements"("performed_by");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

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
