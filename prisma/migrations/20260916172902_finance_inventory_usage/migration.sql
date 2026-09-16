-- CreateTable
CREATE TABLE "finance_inventory_usages" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_inventory_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_inventory_usages_date_idx" ON "finance_inventory_usages"("date");

-- CreateIndex
CREATE INDEX "finance_inventory_usages_itemId_idx" ON "finance_inventory_usages"("itemId");

-- AddForeignKey
ALTER TABLE "finance_inventory_usages" ADD CONSTRAINT "finance_inventory_usages_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "finance_inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
