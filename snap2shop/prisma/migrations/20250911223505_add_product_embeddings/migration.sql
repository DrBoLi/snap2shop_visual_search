-- CreateTable
CREATE TABLE "ProductEmbedding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'clip-vit-base-patch32',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductEmbedding_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "ProductImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_imageId_key" ON "ProductEmbedding"("imageId");

-- CreateIndex
CREATE INDEX "ProductEmbedding_shop_idx" ON "ProductEmbedding"("shop");

-- CreateIndex
CREATE INDEX "ProductEmbedding_imageId_idx" ON "ProductEmbedding"("imageId");
