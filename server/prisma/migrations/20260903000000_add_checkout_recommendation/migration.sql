-- CreateTable
CREATE TABLE "CheckoutRecommendation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecommendation_productId_key" ON "CheckoutRecommendation"("productId");

-- CreateIndex
CREATE INDEX "CheckoutRecommendation_isActive_position_idx" ON "CheckoutRecommendation"("isActive", "position");
