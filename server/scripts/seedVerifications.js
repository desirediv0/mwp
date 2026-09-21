import dotenv from "dotenv";
import crypto from "crypto";
import { prisma } from "../config/db.js";

dotenv.config();

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateCode = () => {
  let s = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `MWP-${s}`;
};

const SAMPLES = [
  {
    productName: "Ultra Pro Whey Isolate",
    batchNumber: "UP24001",
    lotNumber: "LOT24001",
    manufacturingDate: new Date("2026-01-15"),
    expiryDate: new Date("2027-07-15"),
    authenticityStatus: "VERIFIED",
    status: "ACTIVE",
    description:
      "A premium whey protein isolate formulated for fast absorption and lean muscle support. Each batch is lab-tested for purity and potency before release.",
    ingredients: ["Whey Protein Isolate", "BCAA", "Digestive Enzymes"],
    origin: "Made in India",
    badgeType: "Lab Tested",
  },
  {
    productName: "MWP Creatine Monohydrate",
    batchNumber: "CR24014",
    lotNumber: "LOT24014",
    manufacturingDate: new Date("2026-03-01"),
    expiryDate: new Date("2028-03-01"),
    authenticityStatus: "VERIFIED",
    status: "ACTIVE",
    description:
      "Micronized creatine monohydrate for strength and power output. Third-party tested for banned substances.",
    ingredients: ["Creatine Monohydrate"],
    origin: "Made in India",
    badgeType: "GMP Certified",
  },
  {
    productName: "MWP Pre-Workout Ignite",
    batchNumber: "PW23099",
    lotNumber: "LOT23099",
    manufacturingDate: new Date("2025-06-01"),
    expiryDate: new Date("2026-06-01"),
    authenticityStatus: "VERIFIED",
    status: "EXPIRED",
    description: "High-stimulant pre-workout for energy and focus.",
    ingredients: ["Caffeine Anhydrous", "Beta-Alanine", "L-Citrulline"],
    origin: "Made in India",
    badgeType: null,
  },
  {
    productName: "MWP Omega-3 Fish Oil",
    batchNumber: "OM24007",
    lotNumber: "LOT24007",
    manufacturingDate: new Date("2026-02-10"),
    expiryDate: new Date("2027-08-10"),
    authenticityStatus: "UNVERIFIED",
    status: "SUSPENDED",
    description: "Pending re-verification after a supplier documentation update.",
    ingredients: ["Fish Oil Concentrate", "EPA", "DHA"],
    origin: "Imported",
    badgeType: null,
  },
];

async function seedVerifications() {
  try {
    const created = [];
    for (const s of SAMPLES) {
      let verificationCode;
      for (let i = 0; i < 10; i++) {
        const code = generateCode();
        const existing = await prisma.verification.findUnique({ where: { verificationCode: code } });
        if (!existing) {
          verificationCode = code;
          break;
        }
      }
      if (!verificationCode) throw new Error("Failed to generate unique code");

      const record = await prisma.verification.create({
        data: { verificationCode, ...s },
      });
      created.push(record);
      console.log(`Created: ${record.productName} -> ${record.verificationCode} [${record.status}]`);
    }

    console.log("");
    console.log("==================================================");
    console.log("  Seeded Verification Records");
    console.log("==================================================");
    for (const r of created) {
      console.log(`  ${r.productName}`);
      console.log(`    Code: ${r.verificationCode}`);
      console.log(`    URL:  https://mwpsupplements.com/verify/${r.verificationCode}`);
      console.log(`    Local: http://localhost:3000/verify/${r.verificationCode}`);
      console.log("");
    }
  } catch (error) {
    console.error("Error seeding verifications:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedVerifications();
