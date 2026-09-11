import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "../utils/generateSKU.js";

const MWP_PRODUCTS = [
  {
    name: "ULTRA PRO - Men's Performance",
    shortName: "ULTRA PRO",
    categoryName: "Men's Performance",
    description: `
      <h2>Peak Male Vitality & Natural Testosterone Support</h2>
      <p>MWP <strong>ULTRA PRO</strong> is an advanced, clinically dosed performance formulation engineered specifically for men seeking optimized stamina, strength, lean muscle recovery, and elevated vitality.</p>
      <h3>Key Clinical Active Ingredients:</h3>
      <ul>
        <li><strong>Tongkat Ali (Standardized Eurycoma Longifolia):</strong> Stimulates free testosterone production and masculine drive.</li>
        <li><strong>PrimaVie® Shilajit:</strong> High-potency fulvic acid complex for ATP cellular energy and stamina.</li>
        <li><strong>KSM-66® Ashwagandha:</strong> Premium full-spectrum root extract for stress resilience and cortisol reduction.</li>
        <li><strong>Testofen® Fenugreek Extract:</strong> Clinically studied to support libido, muscle fullness, and free testosterone.</li>
        <li><strong>Boron, Zinc Picolinate & Magnesium Glycinate:</strong> Essential micronutrient cofactor matrix for hormonal balance.</li>
      </ul>
      <h3>Product Features:</h3>
      <ul>
        <li>100% Transparent Label - No Proprietary Blends</li>
        <li>Zero Banned Substances, Third-Party Lab Tested</li>
        <li>GMP & FSSAI Compliant Manufacturing</li>
      </ul>
    `,
    metaTitle: "ULTRA PRO Men's Performance | Natural Testosterone Booster - MWP",
    metaDescription: "Boost male vitality, stamina, and strength with MWP ULTRA PRO. Clinically dosed with Tongkat Ali, PrimaVie Shilajit, Testofen Fenugreek & KSM-66 Ashwagandha.",
    keywords: "Testosterone Booster, Natural Testosterone Booster, Male Vitality, Men's Performance, Tongkat Ali, Shilajit Men, Ashwagandha Men, Testofen Fenugreek, Stamina Booster, Libido Booster Men",
    tags: ["Testosterone", "Male Vitality", "Stamina", "Muscle", "Tongkat Ali", "Shilajit", "Ashwagandha", "Fenugreek", "Boron", "Zinc"],
    price: 3499,
    salePrice: 2499,
    servings: ["60 Veg Capsules", "120 Veg Capsules"],
    badge: "Best Seller",
  },
  {
    name: "POWER MAX - Workout / Gym Performance",
    shortName: "POWER MAX",
    categoryName: "Workout & Gym Performance",
    description: `
      <h2>Explosive Pre-Workout & Nitric Oxide Muscle Pump</h2>
      <p>MWP <strong>POWER MAX</strong> is engineered for high-intensity athletes demanding skin-splitting vascularity, razor-sharp focus, and sustained muscular endurance without the harsh crash.</p>
      <h3>Advanced Workout Matrix:</h3>
      <ul>
        <li><strong>L-Citrulline Malate (2:1):</strong> Maximizes nitric oxide synthesis and massive blood flow dilation.</li>
        <li><strong>Beta-Alanine:</strong> Buffers lactic acid buildup to push past muscular failure.</li>
        <li><strong>L-Arginine Alpha-Ketoglutarate (AAKG):</strong> Synergistic vascularity and cellular pump amplifier.</li>
        <li><strong>Clean Caffeine & L-Theanine:</strong> Smooth, jitter-free mental focus and explosive athletic drive.</li>
        <li><strong>Electrolyte Hydration Complex:</strong> High-bioavailability minerals to prevent intra-workout cramping.</li>
      </ul>
    `,
    metaTitle: "POWER MAX Pre Workout & Nitric Oxide Booster | Gym Performance - MWP",
    metaDescription: "Experience explosive pumps, laser focus, and maximum endurance with MWP POWER MAX. Clinically formulated with L-Citrulline, Beta-Alanine, and Nitric Oxide boosters.",
    keywords: "Pre Workout, Pre Workout Supplement, Muscle Pump, Pump Supplement, Nitric Oxide, Nitric Oxide Booster, Blood Flow, L Citrulline, Citrulline Malate, Gym Performance",
    tags: ["Preworkout", "Pump", "Nitric Oxide", "Citrulline", "Strength", "Endurance", "Gym", "Power", "Vascularity"],
    price: 2999,
    salePrice: 1999,
    servings: ["30 Servings (300g)", "60 Servings (600g)"],
    badge: "High Stimulant",
  },
  {
    name: "RAPID BOOST - Fast Performance",
    shortName: "RAPID BOOST",
    categoryName: "Men's Performance",
    description: `
      <h2>Rapid-Action Circulation, Stamina & Performance Surge</h2>
      <p>When minutes count, MWP <strong>RAPID BOOST</strong> delivers rapid vascular expansion, fast-acting nitric oxide elevation, and energized athletic output.</p>
      <h3>Fast Absorption Technology:</h3>
      <ul>
        <li><strong>Micro-Enkapsulated L-Arginine & Citrulline:</strong> Ultra-fast delivery system for instant blood flow support.</li>
        <li><strong>Beetroot Extract (Nitrate Standardized):</strong> Natural cardiovascular and oxygen delivery enhancement.</li>
        <li><strong>Korean Red Ginseng:</strong> Immediate physical stamina, vitality, and adrenal recharge.</li>
        <li><strong>BioPerine® Black Pepper Extract:</strong> Multiplies nutrient bioavailability and absorption speed by up to 200%.</li>
      </ul>
    `,
    metaTitle: "RAPID BOOST Fast Acting Male Performance & Blood Flow - MWP",
    metaDescription: "Instant nitric oxide booster and fast-acting stamina support. MWP RAPID BOOST enhances circulation, energy, and peak performance when you need it most.",
    keywords: "Fast Acting Supplement, Male Performance Booster, Rapid Performance, Blood Flow Men, Nitric Oxide Booster, Circulation Support, Male Stamina, Men's Energy",
    tags: ["Rapid", "Fast Acting", "Circulation", "Bloodflow", "Nitric Oxide", "Stamina", "Energy", "Vitality"],
    price: 3199,
    salePrice: 2199,
    servings: ["30 Fast-Acting Capsules", "60 Fast-Acting Capsules"],
    badge: "Fast Acting",
  },
  {
    name: "HER POWER - Women's Wellness",
    shortName: "HER POWER",
    categoryName: "Women's Wellness",
    description: `
      <h2>Hormonal Balance, Intimate Vitality & Feminine Wellness</h2>
      <p>MWP <strong>HER POWER</strong> is a doctor-formulated holistic wellness and vitality supplement dedicated to women's hormonal harmony, natural desire, and mood balance.</p>
      <h3>Ayurvedic & Adaptogenic Synergy:</h3>
      <ul>
        <li><strong>Organic Shatavari Extract:</strong> The queen of female adaptogens, nurturing reproductive balance and vitality.</li>
        <li><strong>Peruvian Yellow Maca Root:</strong> Renowned traditional root for female libido, passion, and endurance.</li>
        <li><strong>Myo-Inositol & D-Chiro Inositol (40:1):</strong> Gold standard ratio supporting healthy ovarian function and cycle regularity.</li>
        <li><strong>Vitex (Chasteberry):</strong> Promotes natural progesterone synthesis and relieves monthly hormonal mood shifts.</li>
        <li><strong>Sensoril® Ashwagandha:</strong> Clinically proven to calm stress, elevate mood, and restore intimate confidence.</li>
      </ul>
    `,
    metaTitle: "HER POWER Women's Libido & Hormone Balance Supplement - MWP",
    metaDescription: "Restore female vitality, hormone balance, and natural desire with MWP HER POWER. Formulated with Shatavari, Maca, Inositol, Vitex, and Ashwagandha.",
    keywords: "Women's Libido, Female Libido Booster, Women's Hormone Balance, Hormone Balance Women, Shatavari Women, Maca Women, Myo Inositol, Vitex Women, Female Wellness",
    tags: ["Women", "Hormone Balance", "Female Libido", "Shatavari", "Maca", "Inositol", "Vitex", "Wellness"],
    price: 3299,
    salePrice: 2299,
    servings: ["60 Veg Capsules", "120 Veg Capsules"],
    badge: "For Her",
  },
  {
    name: "HER ENERGY - Energy + Focus",
    shortName: "HER ENERGY",
    categoryName: "Women's Wellness",
    description: `
      <h2>All-Day Clean Energy, Mental Clarity & Stress Adaptogens</h2>
      <p>Say goodbye to brain fog and afternoon crashes. MWP <strong>HER ENERGY</strong> combines gentle organic botanicals with vitalizing adaptogens to keep active women sharp, alert, and energized throughout the day.</p>
      <h3>Clean Focus Formula:</h3>
      <ul>
        <li><strong>Rhodiola Rosea & Cordyceps:</strong> Cellular oxygenation and non-jittery physical stamina.</li>
        <li><strong>Holy Basil (Tulsi) & Bacopa Monnieri:</strong> Neuroprotective support for focus, memory, and cognitive sharpness.</li>
        <li><strong>Methylated B-Complex (B6, B12, Folate):</strong> Essential coenzymes for natural cellular energy metabolism.</li>
        <li><strong>Green Tea EGCG Extract:</strong> Gentle antioxidant thermogenic support without spikes or jitters.</li>
      </ul>
    `,
    metaTitle: "HER ENERGY Clean Focus & Adaptogen Supplement for Women - MWP",
    metaDescription: "Sustain all-day natural energy, mental clarity, and stress relief with MWP HER ENERGY. Pure adaptogens for modern active women.",
    keywords: "Energy Women, Women's Energy, Natural Energy Women, Energy Focus Supplement, Mental Clarity, Adaptogen Women, Stress Support, Women's Stamina",
    tags: ["Energy", "Focus", "Women", "Mental Clarity", "Adaptogen", "Stress Support", "Productivity"],
    price: 2799,
    salePrice: 1899,
    servings: ["60 Veg Capsules", "120 Veg Capsules"],
    badge: "Clean Energy",
  },
  {
    name: "DAILY BOOST - Daily Wellness",
    shortName: "DAILY BOOST",
    categoryName: "Daily Wellness",
    description: `
      <h2>Comprehensive Daily Immunity, Multivitamin & Antioxidant Shield</h2>
      <p>MWP <strong>DAILY BOOST</strong> is the essential foundational wellness stack for active men and women. Engineered with bioavailable vitamins, chelated minerals, and potent antioxidant botanicals to supercharge natural immune defense.</p>
      <h3>Complete Health Shield:</h3>
      <ul>
        <li><strong>32-in-1 Micronutrient Complex:</strong> Essential vitamins A, C, D3 (Vegan), E, K2-MK7, and comprehensive B-complex.</li>
        <li><strong>Immune Defense Matrix:</strong> Pure Zinc Bisglycinate, Selenium, Elderberry, and High-Curcumin Turmeric.</li>
        <li><strong>Antioxidant Superfood Blend:</strong> Spirulina, Amla, Green Tea, and CoQ10 for cellular vitality.</li>
        <li><strong>Probiotic & Digestive Enzyme Blend:</strong> Ensures superior nutrient absorption and gut microbiome health.</li>
      </ul>
    `,
    metaTitle: "DAILY BOOST Daily Multivitamin & Immunity Supplement - MWP",
    metaDescription: "Fuel your everyday health with MWP DAILY BOOST. Complete 32-in-1 multivitamin, immune booster, and antioxidant shield for men and women.",
    keywords: "Daily Wellness, Daily Supplement, Daily Vitamins, Immune Support, Immunity Supplement, Antioxidant Support, Men's Wellness, Women's Wellness, Daily Nutrition",
    tags: ["Daily", "Wellness", "Immunity", "Multivitamin", "Antioxidant", "Nutrition", "Health", "Men & Women"],
    price: 2199,
    salePrice: 1499,
    servings: ["60 Tablets", "120 Tablets"],
    badge: "Daily Essential",
  },
];

async function seedMwp() {
  console.log("==================================================");
  console.log("  MWP SUPPLEMENTS - Master Product Seeding Script");
  console.log("  MEN | WOMEN | POWER - 6 Core SEO Playbook Products");
  console.log("==================================================");

  // 1. Create or verify Categories
  const categoryNames = [
    "Men's Performance",
    "Workout & Gym Performance",
    "Women's Wellness",
    "Daily Wellness",
  ];

  const categoryMap = {};

  for (const catName of categoryNames) {
    let cat = await prisma.category.findFirst({
      where: { name: { equals: catName, mode: "insensitive" } },
    });

    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name: catName,
          slug: createSlug(catName),
          description: `Elite formulations in ${catName} by MWP SUPPLEMENTS.`,
        },
      });
      console.log(`+ Created Category: ${catName}`);
    } else {
      console.log(`= Existing Category: ${catName}`);
    }
    categoryMap[catName] = cat;
  }

  // 2. Create or verify Servings Attribute
  let servingsAttr = await prisma.attribute.findFirst({
    where: { name: { equals: "Size", mode: "insensitive" } },
    include: { values: true },
  });

  if (!servingsAttr) {
    servingsAttr = await prisma.attribute.create({
      data: {
        name: "Size",
        inputType: "select",
        values: {
          create: [
            { value: "30 Servings (300g)" },
            { value: "60 Servings (600g)" },
            { value: "30 Fast-Acting Capsules" },
            { value: "60 Fast-Acting Capsules" },
            { value: "60 Veg Capsules" },
            { value: "120 Veg Capsules" },
            { value: "60 Tablets" },
            { value: "120 Tablets" },
          ],
        },
      },
      include: { values: true },
    });
    console.log("+ Created 'Size' attribute with supplement size values.");
  }

  // 3. Seed 6 Products
  for (const item of MWP_PRODUCTS) {
    const slug = createSlug(item.name);
    const existing = await prisma.product.findFirst({
      where: { slug },
    });

    if (existing) {
      console.log(`= Product already exists: ${item.name}`);
      continue;
    }

    const category = categoryMap[item.categoryName];

    // Find attribute values for this product's servings
    const matchedValues = [];
    for (const s of item.servings) {
      let val = servingsAttr.values.find(
        (v) => v.value.toLowerCase() === s.toLowerCase()
      );
      if (!val) {
        val = await prisma.attributeValue.create({
          data: {
            attributeId: servingsAttr.id,
            value: s,
          },
        });
      }
      matchedValues.push(val);
    }

    const createdProduct = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description.trim(),
        slug,
        hasVariants: true,
        featured: true,
        productType: ["featured", "bestseller"],
        isActive: true,
        primaryCategoryId: category.id,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        keywords: item.keywords,
        tags: item.tags,
        ourProduct: true,
        categories: {
          create: [
            {
              categoryId: category.id,
              isPrimary: true,
            },
          ],
        },
        variants: {
          create: matchedValues.map((val, idx) => ({
            sku: generateSKU(
              {
                name: item.shortName,
                categoryName: category.name,
                basePrice: item.salePrice,
              },
              val.value,
              idx + 1
            ),
            price: item.price * (idx === 1 ? 1.75 : 1.0),
            salePrice: item.salePrice * (idx === 1 ? 1.75 : 1.0),
            quantity: 250,
            isActive: true,
            attributes: {
              create: [
                {
                  attributeValueId: val.id,
                },
              ],
            },
          })),
        },
      },
    });

    console.log(`+ Seeded Product: ${createdProduct.name} (ID: ${createdProduct.id})`);
  }

  console.log("==================================================");
  console.log("MWP Supplements seeding completed successfully!");
  console.log("==================================================");
}

seedMwp()
  .catch((e) => {
    console.error("Error seeding MWP products:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
