/*
  Warnings:

  - You are about to drop the `SectionRecipe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SectionRecipe" DROP CONSTRAINT "SectionRecipe_assigned_by_fkey";

-- DropForeignKey
ALTER TABLE "SectionRecipe" DROP CONSTRAINT "SectionRecipe_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "SectionRecipe" DROP CONSTRAINT "SectionRecipe_section_id_fkey";

-- DropTable
DROP TABLE "SectionRecipe";

-- CreateTable
CREATE TABLE "section_recipes" (
    "id" SERIAL NOT NULL,
    "section_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,
    "assigned_by" INTEGER NOT NULL,
    "notes" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_recipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "section_recipes_section_id_recipe_id_key" ON "section_recipes"("section_id", "recipe_id");

-- AddForeignKey
ALTER TABLE "section_recipes" ADD CONSTRAINT "section_recipes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_recipes" ADD CONSTRAINT "section_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_recipes" ADD CONSTRAINT "section_recipes_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
