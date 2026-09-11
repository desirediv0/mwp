-- Add warehouse tracking to orders (which Shiprocket pickup location an order ships from)
ALTER TABLE "Order" ADD COLUMN "warehouseId" TEXT;
ALTER TABLE "Order" ADD COLUMN "warehouseNickname" TEXT;
ALTER TABLE "Order" ADD COLUMN "warehouseAssignedBy" TEXT;
