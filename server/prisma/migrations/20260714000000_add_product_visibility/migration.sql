-- CreateEnum
CREATE TYPE "ProductVisibility" AS ENUM ('PUBLIC', 'SECRET');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "visibility" "ProductVisibility" NOT NULL DEFAULT 'PUBLIC';
