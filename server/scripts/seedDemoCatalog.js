import { prisma } from "../config/db.js";
import { createSlug } from "../helper/Slug.js";
import { generateSKU } from "../utils/generateSKU.js";

/**
 * Demo catalogue seed for MWP SUPPLEMENTS.
 *
 * Creates a set of categories and products with realistic supplement content
 * and wires them into the homepage product sections (featured / bestseller /
 * latest / trending / new) so the storefront home page has data to render.
 *
 * Safe to re-run: it skips categories and products that already exist by slug
 * and re-syncs section membership.
 *
 * Run:  npm run seed:demo        (from the server/ directory)
 */

/* ------------------------------------------------------------------ *
 * Categories
 * ------------------------------------------------------------------ */
const CATEGORIES = [
  {
    name: "Men's Performance",
    description: "Testosterone support, stamina, and male vitality formulations.",
  },
  {
    name: "Workout & Gym Performance",
    description: "Pre-workout, pump, endurance, and recovery for hard training.",
  },
  {
    name: "Women's Wellness",
    description: "Hormonal balance, energy, and daily vitality built for women.",
  },
  {
    name: "Daily Wellness",
    description: "Multivitamins, immunity, and everyday foundational nutrition.",
  },
  {
    name: "Protein & Muscle",
    description: "Whey, plant protein, and lean-mass support for muscle growth.",
  },
  {
    name: "Immunity & Recovery",
    description: "Antioxidants, joint support, sleep, and post-training recovery.",
  },
];

/* ------------------------------------------------------------------ *
 * Products
 *   sections: which homepage sections this product should appear in.
 *             Valid: featured | bestseller | latest | trending | new
 *   The section slugs also drive the `productType` JSON array so the
 *   API fallback query (`array_contains`) works even before an admin
 *   arranges the section manually.
 * ------------------------------------------------------------------ */
const PRODUCTS = [
  {
    name: "ULTRA PRO Testosterone Matrix",
    category: "Men's Performance",
    price: 3499,
    salePrice: 2499,
    sizes: ["60 Veg Capsules", "120 Veg Capsules"],
    sections: ["featured", "bestseller"],
    tags: ["Testosterone", "Stamina", "Tongkat Ali", "Shilajit", "Ashwagandha"],
    keywords: "testosterone booster, male vitality, tongkat ali, shilajit, ashwagandha",
    metaTitle: "ULTRA PRO Testosterone Matrix | Men's Performance - MWP",
    metaDescription:
      "Clinically dosed testosterone and stamina support with Tongkat Ali, PrimaVie Shilajit, Testofen Fenugreek and KSM-66 Ashwagandha.",
    description: `
      <h2>Peak Male Vitality & Natural Testosterone Support</h2>
      <p>An advanced, clinically dosed performance formulation for men seeking optimized stamina, strength, lean-muscle recovery, and elevated vitality.</p>
      <ul>
        <li><strong>Tongkat Ali (standardized):</strong> supports free testosterone and drive.</li>
        <li><strong>PrimaVie&reg; Shilajit:</strong> fulvic-acid complex for ATP cellular energy.</li>
        <li><strong>KSM-66&reg; Ashwagandha:</strong> stress resilience and cortisol control.</li>
        <li><strong>Testofen&reg; Fenugreek:</strong> libido, muscle fullness, free testosterone.</li>
      </ul>`,
  },
  {
    name: "POWER MAX Pre-Workout",
    category: "Workout & Gym Performance",
    price: 2999,
    salePrice: 1999,
    sizes: ["30 Servings (300g)", "60 Servings (600g)"],
    sections: ["featured", "bestseller", "trending"],
    tags: ["Pre-Workout", "Pump", "Nitric Oxide", "Citrulline", "Beta-Alanine"],
    keywords: "pre workout, muscle pump, nitric oxide booster, citrulline malate",
    metaTitle: "POWER MAX Pre-Workout & Nitric Oxide Booster - MWP",
    metaDescription:
      "Explosive pumps, laser focus and sustained endurance with L-Citrulline, Beta-Alanine and a clean caffeine + L-Theanine focus matrix.",
    description: `
      <h2>Explosive Pre-Workout & Nitric Oxide Muscle Pump</h2>
      <p>Engineered for high-intensity athletes demanding skin-splitting vascularity, sharp focus, and sustained muscular endurance without the crash.</p>
      <ul>
        <li><strong>L-Citrulline Malate (2:1):</strong> maximizes nitric-oxide synthesis and blood flow.</li>
        <li><strong>Beta-Alanine:</strong> buffers lactic acid to push past failure.</li>
        <li><strong>Clean Caffeine + L-Theanine:</strong> smooth, jitter-free focus.</li>
      </ul>`,
  },
  {
    name: "RAPID BOOST Circulation Support",
    category: "Men's Performance",
    price: 3199,
    salePrice: 2199,
    sizes: ["30 Fast-Acting Capsules", "60 Fast-Acting Capsules"],
    sections: ["trending", "latest", "new"],
    tags: ["Fast Acting", "Circulation", "Nitric Oxide", "Stamina", "Energy"],
    keywords: "fast acting supplement, circulation support, nitric oxide booster",
    metaTitle: "RAPID BOOST Fast-Acting Circulation & Performance - MWP",
    metaDescription:
      "Rapid vascular expansion and fast-acting nitric-oxide elevation with micro-encapsulated L-Arginine, beetroot nitrate and Korean Red Ginseng.",
    description: `
      <h2>Rapid-Action Circulation, Stamina & Performance Surge</h2>
      <p>When minutes count, RAPID BOOST delivers rapid vascular expansion, fast-acting nitric-oxide elevation, and energized athletic output.</p>
      <ul>
        <li><strong>Micro-encapsulated L-Arginine &amp; Citrulline:</strong> ultra-fast delivery.</li>
        <li><strong>Beetroot Extract (nitrate standardized):</strong> oxygen-delivery support.</li>
        <li><strong>Korean Red Ginseng:</strong> immediate stamina and vitality.</li>
      </ul>`,
  },
  {
    name: "HER POWER Hormone Balance",
    category: "Women's Wellness",
    price: 3299,
    salePrice: 2299,
    sizes: ["60 Veg Capsules", "120 Veg Capsules"],
    sections: ["featured", "bestseller"],
    tags: ["Women", "Hormone Balance", "Shatavari", "Maca", "Inositol"],
    keywords: "women's hormone balance, shatavari, maca, myo inositol, vitex",
    metaTitle: "HER POWER Women's Hormone Balance Supplement - MWP",
    metaDescription:
      "Doctor-formulated hormonal harmony and vitality with Shatavari, Peruvian Maca, Myo-Inositol (40:1), Vitex and Sensoril Ashwagandha.",
    description: `
      <h2>Hormonal Balance, Vitality & Feminine Wellness</h2>
      <p>A holistic wellness supplement dedicated to women's hormonal harmony, natural energy, and mood balance.</p>
      <ul>
        <li><strong>Organic Shatavari:</strong> the queen of female adaptogens.</li>
        <li><strong>Myo-Inositol &amp; D-Chiro Inositol (40:1):</strong> ovarian function and cycle support.</li>
        <li><strong>Vitex (Chasteberry):</strong> supports natural progesterone rhythm.</li>
      </ul>`,
  },
  {
    name: "HER ENERGY Clean Focus",
    category: "Women's Wellness",
    price: 2799,
    salePrice: 1899,
    sizes: ["60 Veg Capsules", "120 Veg Capsules"],
    sections: ["latest", "new", "trending"],
    tags: ["Energy", "Focus", "Women", "Adaptogen", "Stress Support"],
    keywords: "natural energy women, mental clarity, adaptogen, stress support",
    metaTitle: "HER ENERGY Clean Focus & Adaptogen Supplement - MWP",
    metaDescription:
      "All-day natural energy, mental clarity and stress relief with Rhodiola, Cordyceps, Tulsi, Bacopa and a methylated B-complex.",
    description: `
      <h2>All-Day Clean Energy, Mental Clarity & Stress Adaptogens</h2>
      <p>Gentle organic botanicals with vitalizing adaptogens to keep active women sharp, alert, and energized all day.</p>
      <ul>
        <li><strong>Rhodiola Rosea &amp; Cordyceps:</strong> cellular oxygenation, non-jittery stamina.</li>
        <li><strong>Holy Basil (Tulsi) &amp; Bacopa Monnieri:</strong> focus and memory support.</li>
        <li><strong>Methylated B-Complex:</strong> natural cellular energy metabolism.</li>
      </ul>`,
  },
  {
    name: "DAILY BOOST 32-in-1 Multivitamin",
    category: "Daily Wellness",
    price: 2199,
    salePrice: 1499,
    sizes: ["60 Tablets", "120 Tablets"],
    sections: ["featured", "bestseller", "new"],
    tags: ["Daily", "Immunity", "Multivitamin", "Antioxidant", "Men & Women"],
    keywords: "daily multivitamin, immune support, antioxidant, daily nutrition",
    metaTitle: "DAILY BOOST Daily Multivitamin & Immunity - MWP",
    metaDescription:
      "Complete 32-in-1 multivitamin, immune booster and antioxidant shield with chelated minerals, probiotics and digestive enzymes.",
    description: `
      <h2>Comprehensive Daily Immunity, Multivitamin & Antioxidant Shield</h2>
      <p>The foundational wellness stack for active men and women, with bioavailable vitamins, chelated minerals, and antioxidant botanicals.</p>
      <ul>
        <li><strong>32-in-1 Micronutrient Complex:</strong> vitamins A, C, D3, E, K2-MK7 and B-complex.</li>
        <li><strong>Immune Defense Matrix:</strong> Zinc Bisglycinate, Selenium, Elderberry, Turmeric.</li>
        <li><strong>Probiotic &amp; Enzyme Blend:</strong> superior nutrient absorption.</li>
      </ul>`,
  },
  {
    name: "ISO WHEY Protein Isolate",
    category: "Protein & Muscle",
    price: 4499,
    salePrice: 3299,
    sizes: ["1 kg (30 Servings)", "2 kg (60 Servings)"],
    sections: ["featured", "bestseller", "trending"],
    tags: ["Whey", "Protein", "Isolate", "Muscle", "Recovery"],
    keywords: "whey protein isolate, muscle recovery, lean mass, 27g protein",
    metaTitle: "ISO WHEY Protein Isolate | 27g Protein - MWP",
    metaDescription:
      "Ultra-filtered whey isolate delivering 27g protein and 6g BCAA per scoop with added digestive enzymes and near-zero lactose.",
    description: `
      <h2>Fast-Absorbing 90% Whey Protein Isolate</h2>
      <p>Cross-flow micro-filtered isolate for lean muscle building and rapid post-workout recovery.</p>
      <ul>
        <li><strong>27g Protein / 6g BCAA</strong> per 30g scoop.</li>
        <li><strong>Near-zero lactose, sugar and fat.</strong></li>
        <li><strong>Added DigeZyme&reg; enzymes</strong> for easy digestion.</li>
      </ul>`,
  },
  {
    name: "PLANT PRO Vegan Protein",
    category: "Protein & Muscle",
    price: 3799,
    salePrice: 2799,
    sizes: ["1 kg (28 Servings)"],
    sections: ["latest", "new"],
    tags: ["Vegan", "Plant Protein", "Pea", "Brown Rice", "Dairy Free"],
    keywords: "vegan protein, plant protein, pea protein, dairy free protein",
    metaTitle: "PLANT PRO Vegan Protein | Pea + Brown Rice - MWP",
    metaDescription:
      "Complete amino profile plant protein from pea and brown rice, 24g protein per serving, fully dairy-free and easy to digest.",
    description: `
      <h2>Complete Plant Protein With Full Amino Profile</h2>
      <p>A smooth pea + brown-rice blend delivering a complete amino acid profile without any dairy.</p>
      <ul>
        <li><strong>24g Protein</strong> per serving.</li>
        <li><strong>Naturally sweetened</strong>, gut-friendly formula.</li>
        <li><strong>Sustainably sourced</strong> pea and rice protein.</li>
      </ul>`,
  },
  {
    name: "MASS GAINER XXL",
    category: "Protein & Muscle",
    price: 3999,
    salePrice: 2999,
    sizes: ["1.5 kg", "3 kg"],
    sections: ["trending", "new"],
    tags: ["Mass Gainer", "Weight Gain", "Bulking", "Carbs", "Calories"],
    keywords: "mass gainer, weight gainer, bulking, high calorie protein",
    metaTitle: "MASS GAINER XXL | High-Calorie Bulking Formula - MWP",
    metaDescription:
      "Serious clean-bulk calories with a balanced carb-to-protein ratio, added creatine and digestive enzymes for hard gainers.",
    description: `
      <h2>High-Calorie Clean Bulk Formula</h2>
      <p>Engineered for hard gainers who struggle to hit a calorie surplus from whole food alone.</p>
      <ul>
        <li><strong>Balanced carb : protein ratio</strong> for lean mass.</li>
        <li><strong>Added creatine monohydrate</strong> for strength.</li>
        <li><strong>Digestive enzyme blend</strong> for comfortable digestion.</li>
      </ul>`,
  },
  {
    name: "CREATINE MONO Micronized",
    category: "Workout & Gym Performance",
    price: 1499,
    salePrice: 999,
    sizes: ["250g (83 Servings)", "500g (166 Servings)"],
    sections: ["bestseller", "trending"],
    tags: ["Creatine", "Strength", "Power", "Micronized", "Unflavoured"],
    keywords: "creatine monohydrate, micronized creatine, strength, power output",
    metaTitle: "CREATINE MONO Micronized | Pure Creatine Monohydrate - MWP",
    metaDescription:
      "Ultra-pure micronized creatine monohydrate for strength, power output and cellular hydration. Unflavoured, mixes instantly.",
    description: `
      <h2>Pure Micronized Creatine Monohydrate</h2>
      <p>The most researched sports supplement for strength, power and lean-mass gains.</p>
      <ul>
        <li><strong>3g pure creatine</strong> per serving.</li>
        <li><strong>Micronized</strong> for fast mixing and absorption.</li>
        <li><strong>Unflavoured</strong> &mdash; stack it with anything.</li>
      </ul>`,
  },
  {
    name: "BCAA RECOVER 2:1:1",
    category: "Immunity & Recovery",
    price: 1999,
    salePrice: 1399,
    sizes: ["250g (25 Servings)"],
    sections: ["latest", "new"],
    tags: ["BCAA", "Recovery", "Intra-Workout", "Electrolytes", "Hydration"],
    keywords: "bcaa, intra workout, muscle recovery, electrolytes, hydration",
    metaTitle: "BCAA RECOVER 2:1:1 | Intra-Workout Amino + Electrolytes - MWP",
    metaDescription:
      "Instantized 2:1:1 BCAAs with an electrolyte hydration matrix to reduce muscle breakdown and support intra-workout endurance.",
    description: `
      <h2>Intra-Workout Aminos & Electrolyte Hydration</h2>
      <p>Sip through training to reduce muscle breakdown and stay hydrated.</p>
      <ul>
        <li><strong>7g BCAA (2:1:1)</strong> per serving.</li>
        <li><strong>Electrolyte matrix</strong> to prevent cramping.</li>
        <li><strong>Zero sugar</strong>, naturally flavoured.</li>
      </ul>`,
  },
  {
    name: "OMEGA 3 Triple Strength",
    category: "Daily Wellness",
    price: 1799,
    salePrice: 1199,
    sizes: ["60 Softgels", "120 Softgels"],
    sections: ["bestseller", "new"],
    tags: ["Omega 3", "Fish Oil", "EPA", "DHA", "Heart Health"],
    keywords: "omega 3, fish oil, epa dha, heart health, joint support",
    metaTitle: "OMEGA 3 Triple Strength Fish Oil | High EPA/DHA - MWP",
    metaDescription:
      "Molecularly distilled fish oil delivering high-potency EPA and DHA for heart, brain and joint health with no fishy aftertaste.",
    description: `
      <h2>High-Potency EPA & DHA Fish Oil</h2>
      <p>Molecularly distilled and third-party tested for purity and freshness.</p>
      <ul>
        <li><strong>Triple-strength EPA + DHA</strong> per softgel.</li>
        <li><strong>Enteric coated</strong> &mdash; no fishy burps.</li>
        <li><strong>Supports</strong> heart, brain and joints.</li>
      </ul>`,
  },
  {
    name: "JOINT FLEX Glucosamine Complex",
    category: "Immunity & Recovery",
    price: 2299,
    salePrice: 1599,
    sizes: ["90 Tablets"],
    sections: ["latest"],
    tags: ["Joint", "Glucosamine", "Chondroitin", "MSM", "Mobility"],
    keywords: "joint support, glucosamine chondroitin msm, mobility, cartilage",
    metaTitle: "JOINT FLEX Glucosamine Chondroitin MSM Complex - MWP",
    metaDescription:
      "Comprehensive joint support with Glucosamine, Chondroitin, MSM, Boswellia and Curcumin for mobility and cartilage health.",
    description: `
      <h2>Complete Joint Mobility & Cartilage Support</h2>
      <p>A full-spectrum joint formula for lifters and active adults.</p>
      <ul>
        <li><strong>Glucosamine + Chondroitin + MSM</strong> core matrix.</li>
        <li><strong>Boswellia &amp; Curcumin</strong> for comfort.</li>
        <li><strong>Type II Collagen</strong> for cartilage.</li>
      </ul>`,
  },
  {
    name: "DEEP SLEEP Recovery Formula",
    category: "Immunity & Recovery",
    price: 1899,
    salePrice: 1299,
    sizes: ["60 Veg Capsules"],
    sections: ["trending", "new"],
    tags: ["Sleep", "Recovery", "Magnesium", "L-Theanine", "Melatonin-Free"],
    keywords: "sleep supplement, recovery, magnesium glycinate, l-theanine",
    metaTitle: "DEEP SLEEP Recovery Formula | Melatonin-Free - MWP",
    metaDescription:
      "Non-habit-forming sleep and recovery support with Magnesium Glycinate, L-Theanine, Glycine and Ashwagandha. No melatonin.",
    description: `
      <h2>Restful Sleep & Overnight Recovery</h2>
      <p>Wind down and maximize overnight muscle repair without grogginess.</p>
      <ul>
        <li><strong>Magnesium Glycinate + Glycine</strong> to relax the nervous system.</li>
        <li><strong>L-Theanine</strong> for calm without sedation.</li>
        <li><strong>Melatonin-free</strong>, non-habit forming.</li>
      </ul>`,
  },
  {
    name: "GREENS SUPERFOOD Blend",
    category: "Daily Wellness",
    price: 2499,
    salePrice: 1799,
    sizes: ["300g (30 Servings)"],
    sections: ["latest", "new", "featured"],
    tags: ["Greens", "Superfood", "Detox", "Fiber", "Antioxidant"],
    keywords: "greens powder, superfood blend, spirulina, wheatgrass, fiber",
    metaTitle: "GREENS SUPERFOOD Blend | 25+ Wholefood Greens - MWP",
    metaDescription:
      "25+ wholefood greens, sea vegetables and adaptogens with added fiber and probiotics for daily alkalizing nutrition.",
    description: `
      <h2>Daily Wholefood Greens & Alkalizing Nutrition</h2>
      <p>An easy way to top up your micronutrient and fibre intake every day.</p>
      <ul>
        <li><strong>25+ greens</strong> including spirulina, chlorella and wheatgrass.</li>
        <li><strong>Added fibre + probiotics</strong> for gut health.</li>
        <li><strong>Adaptogen blend</strong> for stress balance.</li>
      </ul>`,
  },
  {
    name: "L-CARNITINE Liquid Shots",
    category: "Workout & Gym Performance",
    price: 1699,
    salePrice: 1199,
    sizes: ["20 Shots"],
    sections: ["new"],
    tags: ["L-Carnitine", "Fat Metabolism", "Energy", "Endurance", "Stim-Free"],
    keywords: "l-carnitine, fat metabolism, endurance, stimulant free energy",
    metaTitle: "L-CARNITINE Liquid Shots | 3000mg Stim-Free - MWP",
    metaDescription:
      "3000mg L-Carnitine L-Tartrate per shot to support fatty-acid metabolism and endurance without any stimulants.",
    description: `
      <h2>Stimulant-Free Fatty-Acid Transport</h2>
      <p>Supports the transport of fatty acids into the mitochondria for energy.</p>
      <ul>
        <li><strong>3000mg L-Carnitine L-Tartrate</strong> per shot.</li>
        <li><strong>Zero stimulants</strong> &mdash; take any time of day.</li>
        <li><strong>Great pre-cardio</strong> or on training days.</li>
      </ul>`,
  },
  {
    name: "ZINC + MAGNESIUM ZMA",
    category: "Men's Performance",
    price: 1299,
    salePrice: 899,
    sizes: ["90 Veg Capsules"],
    sections: ["bestseller", "latest"],
    tags: ["ZMA", "Zinc", "Magnesium", "Vitamin B6", "Recovery"],
    keywords: "zma, zinc magnesium aspartate, recovery, sleep, testosterone support",
    metaTitle: "ZINC + MAGNESIUM ZMA | Recovery & Sleep Support - MWP",
    metaDescription:
      "Classic ZMA with Zinc, Magnesium Aspartate and Vitamin B6 to support recovery, sleep quality and healthy testosterone levels.",
    description: `
      <h2>Recovery, Sleep & Hormone Support</h2>
      <p>A time-tested mineral stack for hard-training athletes.</p>
      <ul>
        <li><strong>Zinc + Magnesium Aspartate + B6</strong> in the classic ratio.</li>
        <li><strong>Supports</strong> deep sleep and overnight recovery.</li>
        <li><strong>Take before bed</strong> on an empty stomach.</li>
      </ul>`,
  },
  {
    name: "GLUTAMINE Recovery Powder",
    category: "Protein & Muscle",
    price: 1599,
    salePrice: 1099,
    sizes: ["250g (50 Servings)"],
    sections: ["new"],
    tags: ["Glutamine", "Recovery", "Gut Health", "Immunity", "Unflavoured"],
    keywords: "l-glutamine, muscle recovery, gut health, immune support",
    metaTitle: "GLUTAMINE Recovery Powder | Pure L-Glutamine - MWP",
    metaDescription:
      "Pure micronized L-Glutamine to support muscle recovery, gut lining integrity and immune function during heavy training blocks.",
    description: `
      <h2>Muscle, Gut & Immune Recovery</h2>
      <p>The most abundant amino acid in muscle tissue, depleted by intense training.</p>
      <ul>
        <li><strong>5g pure L-Glutamine</strong> per serving.</li>
        <li><strong>Micronized</strong> and unflavoured.</li>
        <li><strong>Supports</strong> gut lining and immunity.</li>
      </ul>`,
  },
];

/* ------------------------------------------------------------------ */
async function ensureCategories() {
  const map = {};
  for (const c of CATEGORIES) {
    const slug = createSlug(c.name);
    let cat = await prisma.category.findFirst({
      where: { OR: [{ slug }, { name: c.name }] },
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: c.name, slug, description: c.description },
      });
      console.log(`+ category: ${c.name}`);
    } else {
      console.log(`= category exists: ${c.name}`);
    }
    map[c.name] = cat;
  }
  return map;
}

async function ensureSizeAttribute(allSizes) {
  let attr = await prisma.attribute.findFirst({
    where: { name: { equals: "Size", mode: "insensitive" } },
    include: { values: true },
  });
  if (!attr) {
    attr = await prisma.attribute.create({
      data: { name: "Size", inputType: "select" },
      include: { values: true },
    });
    console.log("+ attribute: Size");
  }
  const byValue = new Map(attr.values.map((v) => [v.value.toLowerCase(), v]));
  for (const size of allSizes) {
    if (!byValue.has(size.toLowerCase())) {
      const v = await prisma.attributeValue.create({
        data: { attributeId: attr.id, value: size },
      });
      byValue.set(size.toLowerCase(), v);
    }
  }
  return byValue;
}

async function ensureSections() {
  const wanted = [
    { slug: "featured", name: "Featured", displayOrder: 1 },
    { slug: "bestseller", name: "Best Sellers", displayOrder: 2 },
    { slug: "latest", name: "Latest", displayOrder: 3 },
    { slug: "trending", name: "Trending Now", displayOrder: 4 },
    { slug: "new", name: "New Arrivals", displayOrder: 5 },
  ];
  const map = {};
  for (const s of wanted) {
    let sec = await prisma.productSection.findUnique({ where: { slug: s.slug } });
    if (!sec) {
      sec = await prisma.productSection.create({
        data: { ...s, description: `${s.name} products`, isActive: true },
      });
      console.log(`+ section: ${s.slug}`);
    }
    map[s.slug] = sec;
  }
  return map;
}

async function seed() {
  console.log("==================================================");
  console.log("  MWP SUPPLEMENTS - Demo Catalogue Seed");
  console.log("==================================================");

  const categoryMap = await ensureCategories();
  const allSizes = [...new Set(PRODUCTS.flatMap((p) => p.sizes))];
  const sizeValues = await ensureSizeAttribute(allSizes);
  const sectionMap = await ensureSections();

  let created = 0;
  let skipped = 0;

  for (const item of PRODUCTS) {
    const slug = createSlug(item.name);
    const existing = await prisma.product.findFirst({ where: { slug } });

    let product = existing;

    if (existing) {
      console.log(`= product exists: ${item.name}`);
      skipped++;
    } else {
      const category = categoryMap[item.category];
      const shortName = item.name.split(" ").slice(0, 2).join(" ");

      product = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description.trim(),
          slug,
          hasVariants: true,
          featured: item.sections.includes("featured"),
          productType: item.sections, // JSON array => array_contains fallback works
          isActive: true,
          visibility: "PUBLIC",
          primaryCategoryId: category.id,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          keywords: item.keywords,
          tags: item.tags,
          ourProduct: true,
          categories: {
            create: [{ categoryId: category.id, isPrimary: true }],
          },
          // No images seeded — the storefront ProductCard falls back to its
          // local /placeholder.jpg when a product has no image URL.
          variants: {
            create: item.sizes.map((size, idx) => {
              const val = sizeValues.get(size.toLowerCase());
              const mult = idx === 0 ? 1 : 1.75;
              return {
                sku: generateSKU(
                  { name: shortName, categoryName: category.name, basePrice: item.salePrice },
                  size,
                  idx + 1
                ),
                price: Math.round(item.price * mult),
                salePrice: Math.round(item.salePrice * mult),
                quantity: 250,
                isActive: true,
                attributes: { create: [{ attributeValueId: val.id }] },
              };
            }),
          },
        },
      });
      console.log(`+ product: ${item.name}  [${item.sections.join(", ")}]`);
      created++;
    }

    // Sync section membership (idempotent)
    for (const secSlug of item.sections) {
      const section = sectionMap[secSlug];
      if (!section) continue;
      const already = await prisma.productSectionItem.findFirst({
        where: { productSectionId: section.id, productId: product.id },
      });
      if (!already) {
        const count = await prisma.productSectionItem.count({
          where: { productSectionId: section.id },
        });
        await prisma.productSectionItem.create({
          data: {
            productSectionId: section.id,
            productId: product.id,
            displayOrder: count,
          },
        });
      }
    }
  }

  console.log("==================================================");
  console.log(`Done. ${created} products created, ${skipped} skipped.`);
  console.log(`Categories: ${CATEGORIES.length}. Sections wired: featured, bestseller, latest, trending, new.`);
  console.log("Storefront home page + /products should now show data.");
  console.log("==================================================");
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
