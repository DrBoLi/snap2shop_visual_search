-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "shopifyProductId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "price" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SyncStatus" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "lastSync" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductEmbedding" (
    "id" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'clip-vit-base-patch32',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_shop_idx" ON "public"."Product"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shopifyProductId_shop_key" ON "public"."Product"("shopifyProductId", "shop");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "public"."ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_shop_idx" ON "public"."ProductImage"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_shop_key" ON "public"."SyncStatus"("shop");

-- CreateIndex
CREATE INDEX "SyncStatus_shop_idx" ON "public"."SyncStatus"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ProductEmbedding_imageId_key" ON "public"."ProductEmbedding"("imageId");

-- CreateIndex
CREATE INDEX "ProductEmbedding_shop_idx" ON "public"."ProductEmbedding"("shop");

-- CreateIndex
CREATE INDEX "ProductEmbedding_imageId_idx" ON "public"."ProductEmbedding"("imageId");

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductEmbedding" ADD CONSTRAINT "ProductEmbedding_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."ProductImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
