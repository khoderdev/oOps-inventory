-- CreateTable
CREATE TABLE "SectionRecipe" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectionRecipe_section_id_recipe_id_key" ON "SectionRecipe"("section_id", "recipe_id");

-- AddForeignKey
ALTER TABLE "SectionRecipe" ADD CONSTRAINT "SectionRecipe_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionRecipe" ADD CONSTRAINT "SectionRecipe_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionRecipe" ADD CONSTRAINT "SectionRecipe_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
