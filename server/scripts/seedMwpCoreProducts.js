import crypto from "crypto";
import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "../utils/generateSKU.js";

// Seeds the real 6 MWP core products (as actual store Products with
// variants/pricing/category, so they show up on the site, in search, and
// can be bought) AND a linked Verification record per product with full
// ingredient/dosage/sourcing data + a permanent QR code.
//
// Run:  node -r dotenv/config scripts/seedMwpCoreProducts.js

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

const DESCRIPTION_NOTE =
  "Ingredient amounts reflect the provided product formulas. Countries listed are MWP procurement targets. " +
  '"Sourced From" is published on customer-facing pages only after supplier/COA country-of-origin documentation confirms the source.';

const PRODUCTS = [
  {
    name: "ULTRA PRO™",
    categoryName: "Men's Performance",
    dosageForm: "Capsule",
    servingSize: "2 Capsules Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 3499,
    salePrice: 2499,
    tagline: "Built for the man who expects more from every day.",
    shortDescription:
      "Ultra Pro brings together globally selected ingredients to support energy, drive, performance and everyday vitality.",
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
    name: "RAPID BOOST™",
    categoryName: "Men's Performance",
    dosageForm: "Tablet",
    servingSize: "2 Tablets Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 3199,
    salePrice: 2199,
    tagline: "Fast-acting support for peak performance moments.",
    shortDescription:
      "Rapid Boost delivers clinically dosed actives for blood flow, stamina, and pre-activity readiness.",
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
    name: "POWER MAX™",
    categoryName: "Workout & Gym Performance",
    dosageForm: "Tablet",
    servingSize: "2 Tablets Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 2999,
    salePrice: 1999,
    tagline: "Maximum output for maximum performance.",
    shortDescription:
      "Power Max is engineered with high-dose actives to fuel pump, endurance, and peak muscular output.",
    ingredients: [
      ing("L-Citrulline Free-Form", "2,000 mg", "USA", "Supports nitric oxide production & muscle pump."),
      ing("L-Arginine Base", "700 mg", "Japan", "Supports vascular health & blood flow."),
      ing("French Maritime Pine Bark Extract", "60 mg", "France", "Supports circulation & antioxidant defense."),
    ],
  },
  {
    name: "HER POWER™",
    categoryName: "Women's Wellness",
    dosageForm: "Tablet",
    servingSize: "2 Tablets Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 3299,
    salePrice: 2299,
    tagline: "Hormone and vitality support, formulated for her.",
    shortDescription:
      "Her Power combines clinically studied actives to support hormone balance, energy, and everyday vitality.",
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
    name: "HER ENERGY™",
    categoryName: "Women's Wellness",
    dosageForm: "Capsule",
    servingSize: "2 Capsules Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 2799,
    salePrice: 1899,
    tagline: "Clean, sustained energy without the crash.",
    shortDescription:
      "Her Energy supports mitochondrial energy production, adrenal resilience, and everyday vitality.",
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
    name: "DAILY VITALITY™",
    categoryName: "Daily Wellness",
    dosageForm: "Capsule",
    servingSize: "2 Capsules Daily",
    whenToTake: "With a meal",
    servingCount: "60 Count",
    price: 2199,
    salePrice: 1499,
    tagline: "Foundational wellness for everyday resilience.",
    shortDescription:
      "Daily Vitality supports cellular energy, cardiovascular health, and daily antioxidant defense.",
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

async function seed() {
  console.log("==================================================");
  console.log("  MWP SUPPLEMENTS - Core Product + Verification Seed");
  console.log("==================================================");

  const categoryNames = [...new Set(PRODUCTS.map((p) => p.categoryName))];
  const categoryMap = {};

  for (const catName of categoryNames) {
    let cat = await prisma.category.findFirst({ where: { name: { equals: catName, mode: "insensitive" } } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: catName, slug: createSlug(catName), description: `Elite formulations in ${catName} by MWP SUPPLEMENTS.` },
      });
      console.log(`+ Created Category: ${catName}`);
    }
    categoryMap[catName] = cat;
  }

  const created = [];

  for (const item of PRODUCTS) {
    const slug = createSlug(item.name);
    let product = await prisma.product.findFirst({ where: { slug } });

    const ingredientList = item.ingredients.map((i) => `${i.name} (${i.amount})`).join(", ");
    const descriptionHtml = `
      <h2>${item.tagline}</h2>
      <p>${item.shortDescription}</p>
      <h3>Ingredients</h3>
      <p>${ingredientList}</p>
      <p><em>${DESCRIPTION_NOTE}</em></p>
    `.trim();

    const category = categoryMap[item.categoryName];

    if (!product) {
      const sku = generateSKU(
        { name: item.name, categoryName: category.name, basePrice: item.salePrice },
        item.servingCount,
        1
      );

      product = await prisma.product.create({
        data: {
          name: item.name,
          description: descriptionHtml,
          slug,
          hasVariants: true,
          featured: true,
          isActive: true,
          ourProduct: true,
          primaryCategoryId: category.id,
          metaTitle: `${item.name} | MWP Supplements`,
          metaDescription: item.shortDescription,
          tags: [item.categoryName],
          dosageForm: item.dosageForm,
          servingSize: item.servingSize,
          whenToTake: item.whenToTake,
          mainBenefits: item.shortDescription,
          categories: { create: [{ categoryId: category.id, isPrimary: true }] },
          variants: {
            create: [
              {
                sku,
                price: item.price,
                salePrice: item.salePrice,
                quantity: 250,
                isActive: true,
              },
            ],
          },
        },
      });
      console.log(`+ Created Product: ${product.name} (${product.slug})`);
    } else {
      console.log(`= Product already exists: ${product.name} (${product.slug})`);
    }

    let verification = await prisma.verification.findFirst({ where: { productId: product.id } });
    if (!verification) {
      const verificationCode = await generateUniqueCode();
      verification = await prisma.verification.create({
        data: {
          verificationCode,
          productId: product.id,
          productName: item.name,
          productSlug: slug,
          tagline: item.tagline,
          shortDescription: item.shortDescription,
          description: DESCRIPTION_NOTE,
          features: [item.servingSize, item.whenToTake, item.servingCount],
          ingredients: item.ingredients,
          origin: "Formulated in the USA — Globally Sourced Ingredients",
          authenticityStatus: "VERIFIED",
          status: "ACTIVE",
        },
      });
      console.log(`  + Verification: ${verification.verificationCode}`);
    } else {
      console.log(`  = Verification already exists: ${verification.verificationCode}`);
    }

    created.push({ product, verification });
  }

  console.log("");
  console.log("==================================================");
  console.log("  Summary");
  console.log("==================================================");
  for (const { product, verification } of created) {
    console.log(`  ${product.name}`);
    console.log(`    Product page:      https://mwpsupplements.com/products/${product.slug}`);
    console.log(`    Verification QR:   https://mwpsupplements.com/verify/${verification.verificationCode}`);
    console.log("");
  }
  console.log("Note: no product images were provided yet — add them from the admin Products page (image doesn't affect the QR/verification URL).");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
