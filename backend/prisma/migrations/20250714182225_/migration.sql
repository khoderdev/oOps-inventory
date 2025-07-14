-- CreateTable
CREATE TABLE "pos_config" (
    "id" SERIAL NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "default_section_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_config_default_section_id_key" ON "pos_config"("default_section_id");

-- AddForeignKey
ALTER TABLE "pos_config" ADD CONSTRAINT "pos_config_default_section_id_fkey" FOREIGN KEY ("default_section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
