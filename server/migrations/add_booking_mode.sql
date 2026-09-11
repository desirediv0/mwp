-- Add bookingMode field to ShiprocketSettings
ALTER TABLE "ShiprocketSettings" ADD COLUMN "bookingMode" TEXT NOT NULL DEFAULT 'MANUAL';
