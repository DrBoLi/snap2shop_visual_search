-- CreateTable
CREATE TABLE "public"."VisualSearchEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "queryData" JSONB,
    "results" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualSearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SearchResultClick" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "searchId" TEXT NOT NULL,
    "sessionId" TEXT,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "similarity" DOUBLE PRECISION,
    "clickType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchResultClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PopularContent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentName" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PopularContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AnalyticsAggregation" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsAggregation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisualSearchEvent_searchId_key" ON "public"."VisualSearchEvent"("searchId");

-- CreateIndex
CREATE INDEX "VisualSearchEvent_shop_eventType_createdAt_idx" ON "public"."VisualSearchEvent"("shop", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "VisualSearchEvent_shop_createdAt_idx" ON "public"."VisualSearchEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "VisualSearchEvent_searchId_idx" ON "public"."VisualSearchEvent"("searchId");

-- CreateIndex
CREATE INDEX "SearchResultClick_shop_createdAt_idx" ON "public"."SearchResultClick"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "SearchResultClick_searchId_idx" ON "public"."SearchResultClick"("searchId");

-- CreateIndex
CREATE INDEX "SearchResultClick_productId_idx" ON "public"."SearchResultClick"("productId");

-- CreateIndex
CREATE INDEX "PopularContent_shop_contentType_clickCount_idx" ON "public"."PopularContent"("shop", "contentType", "clickCount");

-- CreateIndex
CREATE INDEX "PopularContent_shop_lastUsed_idx" ON "public"."PopularContent"("shop", "lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "PopularContent_shop_contentType_contentId_key" ON "public"."PopularContent"("shop", "contentType", "contentId");

-- CreateIndex
CREATE INDEX "AnalyticsAggregation_shop_date_period_idx" ON "public"."AnalyticsAggregation"("shop", "date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsAggregation_shop_date_period_metric_key" ON "public"."AnalyticsAggregation"("shop", "date", "period", "metric");
