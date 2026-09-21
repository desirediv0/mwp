import dotenv from "dotenv";
import crypto from "crypto";
import { prisma } from "../config/db.js";

dotenv.config();

// Seeds the 6 MWP product verification records with full ingredient/dosage/
// sourcing data, each getting its own permanent verificationCode + QR.
// Run:  node -r dotenv/config scripts/seedMwpVerifications.js

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateCode = () => {
  let s = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `MWP-${s}`;
};
const generateUniqueCode = async () => {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    if (!(await prisma.verification.findUnique({ where: { verificationCode: code } }))) return code;
  }
  throw new Error("Failed to generate a unique verification code");
};

const ing = (name, amount, origin, description = "") => ({ name, amount, origin, description });

const PRODUCTS = [
  {
    productName: "ULTRA PRO™",
    productSlug: "ultra-pro",
    tagline: "Built for the man who expects more from every day.",
    shortDescription:
      "Ultra Pro brings together globally selected ingredients to support energy, drive, performance and everyday vitality.",
    features: ["2 Capsules Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("KSM-66 Ashwagandha", "600 mg", "India", "Supports stress resilience, energy & performance."),
      ing("Shilajit Extract 50%", "250 mg", "India", "Supports energy, stamina & male vitality."),
      ing("Tongkat Ali 100:1", "200 mg", "Malaysia", "Supports male vitality, drive & performance."),
      ing("Fenugreek Extract 60%", "200 mg", "India", "Supports vitality, strength & healthy male performance."),
      ing("Zinc Bisglycinate", "3 mg elemental zinc", "USA", "Supports normal testosterone levels & immune health."),
      ing("Boron Glycinate", "0.34 mg elemental boron", "USA", "Provides trace-mineral support for overall male wellness."),
      ing("Vegan/Lichen Vitamin D3", "2,000 IU", "USA", "Supports muscle, immune & bone health."),
      ing("Vitamin K2 MK-7", "45 mcg", "Japan", "Supports healthy calcium utilization & bone health."),
      ing("L-Selenomethionine", "100 mcg selenium", "USA", "Provides antioxidant and thyroid-supporting nutrition."),
      ing("Saffron Extract 5% Crocin", "10 mg", "Iran", "Supports mood, vitality & overall well-being."),
    ],
  },
  {
    productName: "RAPID BOOST™",
    productSlug: "rapid-boost",
    tagline: "Fast-acting support for peak performance moments.",
    shortDescription:
      "Rapid Boost delivers clinically dosed actives for blood flow, stamina, and pre-activity readiness.",
    features: ["2 Tablets Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("L-Citrulline Malate 2:1", "2,000 mg", "USA", "Supports nitric oxide production & blood flow."),
      ing("Panax Ginseng Root Extract", "200 mg", "South Korea", "Supports energy, stamina & vitality."),
      ing("Black Maca Root Extract 4:1", "300 mg", "Peru", "Supports drive, stamina & performance."),
      ing("Fenugreek Extract 60%", "300 mg", "India", "Supports vitality & healthy performance."),
      ing("Pomegranate Extract", "150 mg", "India", "Supports antioxidant & circulatory health."),
      ing("Ginkgo Biloba Extract", "60 mg", "Germany", "Supports circulation & cognitive function."),
      ing("Zinc Citrate", "10 mg elemental zinc", "USA", "Supports normal testosterone levels & immune health."),
    ],
  },
  {
    productName: "POWER MAX™",
    productSlug: "power-max",
    tagline: "Maximum output for maximum performance.",
    shortDescription:
      "Power Max is engineered with high-dose actives to fuel pump, endurance, and peak muscular output.",
    features: ["2 Tablets Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("L-Citrulline Free-Form", "2,000 mg", "USA", "Supports nitric oxide production & muscle pump."),
      ing("L-Arginine Base", "700 mg", "Japan", "Supports vascular health & blood flow."),
      ing("French Maritime Pine Bark Extract", "60 mg", "France", "Supports circulation & antioxidant defense."),
    ],
  },
  {
    productName: "HER POWER™",
    productSlug: "her-power",
    tagline: "Hormone and vitality support, formulated for her.",
    shortDescription:
      "Her Power combines clinically studied actives to support hormone balance, energy, and everyday vitality.",
    features: ["2 Tablets Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("Myo-Inositol", "2,000 mg", "USA", "Supports hormonal balance & metabolic health."),
      ing("D-Chiro Inositol", "50 mg", "USA", "Supports hormonal balance in combination with Myo-Inositol."),
      ing("Shatavari Root Extract", "400 mg", "India", "Traditionally used to support women's wellness."),
      ing("Magnesium Glycinate", "300 mg", "USA", "Supports muscle, nerve & metabolic function."),
      ing("Vitamin B6 (P-5-P)", "10 mg", "USA", "Supports hormonal balance & energy metabolism."),
      ing("Zinc Bisglycinate", "3 mg elemental zinc", "USA", "Supports immune health & hormonal balance."),
      ing("Chromium Picolinate", "24 mcg elemental chromium", "USA", "Supports healthy metabolism."),
      ing("Vegan/Lichen Vitamin D3", "2,000 IU", "USA", "Supports immune & bone health."),
    ],
  },
  {
    productName: "HER ENERGY™",
    productSlug: "her-energy",
    tagline: "Clean, sustained energy without the crash.",
    shortDescription:
      "Her Energy supports mitochondrial energy production, adrenal resilience, and everyday vitality.",
    features: ["2 Capsules Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("Rhodiola rosea Extract", "300 mg", "Sweden", "Supports stress resilience & mental energy."),
      ing("Cordyceps CS-4 Extract", "400 mg", "China", "Supports stamina & energy production."),
      ing("CoQ10 Ubiquinol", "200 mg", "Japan", "Supports cellular energy production."),
      ing("Magnesium Glycinate", "200 mg", "USA", "Supports muscle & nerve function."),
      ing("Iron Bisglycinate", "3.6 mg elemental iron", "USA", "Supports healthy oxygen transport & energy."),
      ing("Vitamin B12 (Methylcobalamin)", "500 mcg", "USA", "Supports energy metabolism & nervous system health."),
      ing("Vegan Vitamin D3", "2,000 IU", "USA", "Supports immune & bone health."),
    ],
  },
  {
    productName: "DAILY VITALITY™",
    productSlug: "daily-vitality",
    tagline: "Foundational wellness for everyday resilience.",
    shortDescription:
      "Daily Vitality supports cellular energy, cardiovascular health, and daily antioxidant defense.",
    features: ["2 Capsules Daily", "With a Meal", "60 Count"],
    origin: "Formulated in the USA — Globally Sourced Ingredients",
    ingredients: [
      ing("CoQ10 Ubiquinol", "100 mg", "Japan", "Supports cellular energy production."),
      ing("KSM-66 Ashwagandha", "400 mg", "India", "Supports stress resilience & everyday vitality."),
      ing("Berberine Phytosome", "300 mg", "Italy", "Supports healthy metabolism & cardiovascular health."),
      ing("Quercetin Phytosome", "100 mg", "Italy", "Supports antioxidant defense & immune health."),
      ing("Vegan Vitamin D3", "2,000 IU", "USA", "Supports immune & bone health."),
      ing("Vitamin K2 MK-7", "100 mcg", "Japan", "Supports healthy calcium utilization & bone health."),
    ],
  },
];

const DESCRIPTION_NOTE =
  "Ingredient amounts reflect the provided product formulas. Countries listed are MWP procurement targets. " +
  '"Sourced From" is published on customer-facing pages only after supplier/COA country-of-origin documentation confirms the source.';

async function seed() {
  const created = [];
  for (const p of PRODUCTS) {
    const verificationCode = await generateUniqueCode();
    const record = await prisma.verification.create({
      data: {
        verificationCode,
        productName: p.productName,
        productSlug: p.productSlug,
        tagline: p.tagline,
        shortDescription: p.shortDescription,
        description: DESCRIPTION_NOTE,
        features: p.features,
        ingredients: p.ingredients,
        origin: p.origin,
        authenticityStatus: "VERIFIED",
        status: "ACTIVE",
      },
    });
    created.push(record);
    console.log(`Created: ${p.productName} -> ${record.verificationCode}`);
  }

  console.log("");
  console.log("==================================================");
  console.log("  MWP Product Verifications Seeded");
  console.log("==================================================");
  for (const r of created) {
    console.log(`  ${r.productName}`);
    console.log(`    Code: ${r.verificationCode}`);
    console.log(`    URL:  https://mwpsupplements.com/verify/${r.verificationCode}`);
    console.log("");
  }
  console.log(
    "Note: no product images were provided — productImage is null for all records. Add images later from the admin Verifications page (Edit -> Product Image) without affecting the QR code or URL."
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
