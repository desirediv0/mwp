-- Keep pre-existing orders in their original currency; all new orders use USD.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "RazorpayPayment" ALTER COLUMN "currency" SET DEFAULT 'USD';
