-- CreateTable
CREATE TABLE "recipe_consumptions" (
    "id" SERIAL NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "consumed_by" INTEGER NOT NULL,
    "consumed_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order_id" TEXT,
    "notes" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_consumption_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_consumption_id" INTEGER NOT NULL,
    "raw_material_id" INTEGER NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" "measurement_unit" NOT NULL,
    "base_unit" "measurement_unit" NOT NULL,
    "cost_per_unit" DECIMAL(10,5),

    CONSTRAINT "recipe_consumption_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_consumptions_recipe_id_idx" ON "recipe_consumptions"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_consumptions_section_id_idx" ON "recipe_consumptions"("section_id");

-- CreateIndex
CREATE INDEX "recipe_consumptions_consumed_date_idx" ON "recipe_consumptions"("consumed_date");

-- CreateIndex
CREATE INDEX "recipe_consumptions_consumed_by_idx" ON "recipe_consumptions"("consumed_by");

-- CreateIndex
CREATE INDEX "recipe_consumption_ingredients_recipe_consumption_id_idx" ON "recipe_consumption_ingredients"("recipe_consumption_id");

-- CreateIndex
CREATE INDEX "recipe_consumption_ingredients_raw_material_id_idx" ON "recipe_consumption_ingredients"("raw_material_id");

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumptions" ADD CONSTRAINT "recipe_consumptions_consumed_by_fkey" FOREIGN KEY ("consumed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumption_ingredients" ADD CONSTRAINT "recipe_consumption_ingredients_recipe_consumption_id_fkey" FOREIGN KEY ("recipe_consumption_id") REFERENCES "recipe_consumptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_consumption_ingredients" ADD CONSTRAINT "recipe_consumption_ingredients_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
