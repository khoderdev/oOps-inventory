-- CreateTable
CREATE TABLE "order_counters" (
    "id" TEXT NOT NULL,
    "last_order_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_counters_pkey" PRIMARY KEY ("id")
);
