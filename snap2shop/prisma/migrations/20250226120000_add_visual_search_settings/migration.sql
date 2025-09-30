-- Add availability fields to Product
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "availableForSale" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "totalInventory" INTEGER;

-- Create visual search settings table
CREATE TABLE IF NOT EXISTS "VisualSearchSettings" (
  "id" TEXT NOT NULL,
  "shop" TEXT NOT NULL,
  "hideOutOfStock" BOOLEAN NOT NULL DEFAULT false,
  "similarityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VisualSearchSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VisualSearchSettings_shop_key" UNIQUE ("shop")
);

CREATE INDEX IF NOT EXISTS "VisualSearchSettings_shop_idx" ON "VisualSearchSettings" ("shop");
