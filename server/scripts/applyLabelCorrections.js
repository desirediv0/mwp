import fs from "fs";
import path from "path";
import { prisma } from "../config/db.js";

// Website corrections from "mwp label & website corrections urgent - rehmat".
// Product wording, ingredient lists (copied from the supplied Supplement Facts rows), pack size,
// warnings, blog review line, company phone in FAQs. Titan Force is taken off the website (hidden, not deleted).
//
// Run:  node -r dotenv/config scripts/applyLabelCorrections.js
// A JSON backup of everything it touches is written to server/backups/ first.

const FDA = "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

const WARN = {
  "power-max":
    "WARNING: For adults only. Consult a healthcare professional before use if you are pregnant, nursing, taking medication, or have a medical condition. Consult your doctor before use if you take blood pressure medication, nitrates or blood thinners, or have thyroid, liver or autoimmune conditions. Discontinue use if any adverse reaction occurs. Keep out of reach of children. Do not exceed the recommended serving. Store in a cool, dry place. Do not use if safety seal is broken or missing.",
  "rapid-boost":
    "WARNING: For adults only. Consult a healthcare professional before use if you are pregnant, nursing, taking medication, or have a medical condition. Consult your doctor before use if you take blood pressure medication, nitrates or blood thinners. Discontinue use if any adverse reaction occurs. Keep out of reach of children. Do not exceed the recommended serving. Store in a cool, dry place. Do not use if safety seal is broken or missing.",
  "daily-vitality":
    "WARNING: For adults only. Consult a healthcare professional before use if you are pregnant, nursing, taking medication, or have a medical condition. Consult your doctor before use if you take blood sugar, blood thinner or thyroid medication, or have liver or autoimmune conditions. Discontinue use if any adverse reaction occurs. Keep out of reach of children. Do not exceed the recommended serving. Store in a cool, dry place. Do not use if safety seal is broken or missing.",
  "her-power":
    "WARNING: For adults only. Consult a healthcare professional before use if you are pregnant, nursing, taking medication, or have a medical condition. Consult your doctor before use if you take blood sugar medication. Discontinue use if any adverse reaction occurs. Keep out of reach of children. Do not exceed the recommended serving. Store in a cool, dry place. Do not use if safety seal is broken or missing.",
};

const use = (n) => `As a dietary supplement, adults take ${n} capsules daily with a meal, or as directed by a healthcare professional.`;

// i(name, amount, dv): dv is a percent string or "†" (Daily Value not established). Origins already on file are kept.
const i = (name, amount, dv = "†", keep = null) => ({ name, amount, dv, keep });

const PRODUCTS = {
  "power-max": {
    metaDescription: "Power Max with L-Citrulline, Tongkat Ali and Ashwagandha to support endurance and healthy circulation. 90 capsules.",
    tagline: "Train with purpose.",
    text: "A men's formula with L-Citrulline, Tongkat Ali, Ashwagandha and Panax Ginseng, made to support endurance, daily energy and healthy circulation.*",
    bestFor: "Men who want everyday support for endurance, energy and circulation",
    keywords: "MWP Power Max, men's supplement, endurance, daily energy, healthy circulation, dietary supplement",
    highlights: [
      ["Endurance", "Supports Endurance*"],
      ["Daily Energy", "Supports Daily Energy*"],
      ["Physical Performance", "Supports Physical Performance*"],
      ["Healthy Circulation", "Supports Healthy Circulation*"],
    ],
    serving: "3 capsules daily",
    packSize: "90 capsules",
    use: use(3),
    ingredients: [
      i("Vitamin D (as cholecalciferol from lichen)", "20 mcg (800 IU)", "100%"),
      i("L-Citrulline", "1,500 mg", "†", /citrulline/i),
      i("Tongkat Ali (Eurycoma longifolia) Root Extract (100:1, 1% eurycomanone)", "400 mg", "†", /tongkat/i),
      i("Panax Ginseng (Panax ginseng) Root Extract (4:1, 10% ginsenosides)", "250 mg", "†", /ginseng/i),
      i("French Maritime Pine (Pinus pinaster) Bark Extract (95% proanthocyanidins)", "100 mg", "†", /pine/i),
      i("Saffron Stigma Extract (5% crocin)", "30 mg", "†", /saffron/i),
    ],
  },
  "rapid-boost": {
    metaDescription: "Rapid Boost with L-Arginine, Beet Root and Panax Ginseng to support energy, focus and physical performance. 90 capsules.",
    tagline: "Supports energy, focus and physical performance.*",
    text: "A men's formula with L-Arginine, Beet Root and Panax Ginseng, made to support energy, focus and physical performance.*",
    bestFor: "Men who want everyday support for energy, focus and physical performance",
    keywords: "MWP Rapid Boost, men's supplement, energy, focus, physical performance, dietary supplement",
    highlights: [
      ["Energy & Endurance", "Supports Energy & Endurance*"],
      ["Healthy Circulation", "Supports Healthy Circulation*"],
      ["Physical Performance", "Supports Physical Performance*"],
      ["Mental Focus", "Supports Mental Focus*"],
    ],
    serving: "3 capsules daily",
    packSize: "90 capsules",
    use: use(3),
    ingredients: [
      i("L-Arginine", "1,500 mg", "†", /arginine/i),
      i("Epimedium Aerial Parts Extract (20% icariin)", "300 mg", "†"),
      i("Panax Ginseng (Panax ginseng) Root Extract (4:1, 10% ginsenosides)", "200 mg", "†", /ginseng/i),
      i("French Maritime Pine (Pinus pinaster) Bark Extract (95% proanthocyanidins)", "150 mg", "†"),
      i("Saffron (Crocus sativus) Stigma Extract (5% crocin)", "30 mg", "†", /saffron/i),
    ],
  },
  "daily-vitality": {
    metaTitle: "Daily Vitality – Daily Wellness Capsules | MWP",
    metaDescription: "A daily formula for men and women with CoQ10, KSM-66® Ashwagandha and Berberine, made to support cellular energy, heart health and antioxidant defense.*",
    tagline: "Foundational wellness for everyday resilience.",
    text: "A daily formula for men and women with CoQ10, KSM-66® Ashwagandha and Berberine, made to support cellular energy, heart health and antioxidant defense.*",
    bestFor: "Anyone building a daily wellness routine",
    keywords: "MWP Daily Vitality, daily wellness, cellular energy, heart health, antioxidant support, dietary supplement",
    highlights: [
      ["Cellular Energy", "Supports Cellular Energy*"],
      ["Antioxidant Support", "Provides Antioxidant Support*"],
      ["Heart Health", "Supports Heart Health*"],
      ["Glucose Metabolism", "Supports Healthy Glucose Metabolism Within Normal Range*"],
    ],
    serving: "2 capsules daily",
    packSize: null, // stays 60 capsules
    use: use(2),
    ingredients: [
      i("Vitamin D (as cholecalciferol)", "50 mcg (2,000 IU)", "250%", /vitamin d/i),
      i("Vitamin K (as menaquinone-7)", "100 mcg", "83%", /k2/i),
      i("Selenium (as L-selenomethionine)", "100 mcg", "182%", /selen/i),
      i("Coenzyme Q10 (as ubiquinone)", "100 mg", "†", /coq10|q10/i),
      i("KSM-66® Ashwagandha (Withania somnifera) Root Extract", "300 mg", "†", /ashwagandha/i),
      i("Berberine Phospholipid Complex (sunflower), providing 150 mg berberine", "300 mg", "†", /berberine/i),
      i("Quercetin Phospholipid Complex (sunflower), providing 50 mg quercetin", "100 mg", "†", /quercetin/i),
    ],
  },
  "her-power": {
    metaTitle: "Her Power – Women's Daily Wellness Capsules | MWP",
    metaDescription: "Her Power with Myo-Inositol, Shatavari and Magnesium to support women's daily wellness, stress response and energy metabolism. 90 capsules.",
    tagline: "Her wellness. Her way.",
    text: "A women's daily formula with Myo-Inositol, Shatavari and Magnesium, made to support daily wellness, a healthy stress response and normal energy metabolism.*",
    bestFor: "Women who want everyday support for wellness, stress response and energy metabolism",
    keywords: "MWP Her Power, women's supplement, daily wellness, stress response, energy metabolism, dietary supplement",
    highlights: [
      ["Daily Wellness", "Supports Women's Daily Wellness*"],
      ["Stress Response", "Supports a Healthy Stress Response*"],
      ["Energy Metabolism", "Supports Energy Metabolism*"],
      ["Bone & Muscle", "Supports Bone & Muscle Health*"],
    ],
    serving: "3 capsules daily",
    packSize: "90 capsules",
    use: use(3),
    ingredients: [
      i("Vitamin D (as cholecalciferol from lichen)", "50 mcg (2,000 IU)", "250%", /vitamin d|lichen/i),
      i("Vitamin B6 (as pyridoxal-5'-phosphate)", "13 mg", "765%", /b6/i),
      i("Magnesium (as magnesium glycinate)", "28 mg", "7%", /magnesium/i),
      i("Zinc (as zinc bisglycinate)", "3 mg", "27%", /zinc/i),
      i("Chromium (as chromium picolinate)", "30 mcg", "86%", /chromium/i),
      i("Myo-Inositol", "2,000 mg", "†", /^myo/i),
      i("D-Chiro-Inositol", "50 mg", "†", /chiro/i),
      i("Shatavari (Asparagus racemosus) Root Extract (20% saponins)", "200 mg", "†", /shatavari/i),
    ],
  },
};

const desc = (it) => (it.dv === "†" ? "Daily Value not established." : `${it.dv} of the Daily Value.`);

// 1. backup ------------------------------------------------------------------------------------
const slugs = [...Object.keys(PRODUCTS), "titan-force"];
const before = {
  products: await prisma.product.findMany({ where: { slug: { in: slugs } }, include: { ingredientItems: true, variants: { include: { attributes: true } } } }),
  verifications: await prisma.verification.findMany({ where: { productSlug: { in: slugs } } }),
  blogPosts: await prisma.blogPost.findMany({ select: { id: true, slug: true, reviewedBy: true } }),
  faqs: await prisma.fAQ.findMany(),
};
fs.mkdirSync("backups", { recursive: true });
const backup = path.join("backups", `label-corrections-before-${Date.now()}.json`);
fs.writeFileSync(backup, JSON.stringify(before, null, 2));
console.log("Backup written:", backup);

// 2. products ----------------------------------------------------------------------------------
const attr = await prisma.attribute.findFirst({ where: { name: { equals: "Pack size", mode: "insensitive" } } });
let pack90 = null;
if (attr) {
  pack90 =
    (await prisma.attributeValue.findFirst({ where: { attributeId: attr.id, value: "90 capsules" } })) ||
    (await prisma.attributeValue.create({ data: { attributeId: attr.id, value: "90 capsules" } }));
}

for (const [slug, c] of Object.entries(PRODUCTS)) {
  const p = before.products.find((x) => x.slug === slug);
  if (!p) {
    console.log("missing product", slug);
    continue;
  }
  const oldItems = p.ingredientItems;
  const pageContent = { ...(p.pageContent || {}), warning: WARN[slug], suggestedUse: c.use, fdaNote: FDA };

  await prisma.product.update({
    where: { id: p.id },
    data: {
      ...(c.metaTitle ? { metaTitle: c.metaTitle } : {}),
      metaDescription: c.metaDescription,
      description: `<h2>${c.tagline}</h2><p>${c.text}</p>`,
      mainBenefits: c.text,
      bestFor: c.bestFor,
      keywords: c.keywords,
      dosageForm: "Capsule",
      servingSize: c.serving,
      whenToTake: "With a meal",
      highlights: c.highlights.map(([title, text]) => ({ title, text })),
      pageContent,
    },
  });

  // ingredient rows exactly as on the Supplement Facts (existing origins are kept for the same ingredient)
  await prisma.productIngredientItem.deleteMany({ where: { productId: p.id } });
  let order = 0;
  for (const it of c.ingredients) {
    const old = it.keep ? oldItems.find((o) => it.keep.test(o.name)) : null;
    await prisma.productIngredientItem.create({
      data: {
        productId: p.id,
        name: it.name,
        amount: `${it.amount}${it.dv !== "†" ? ` · ${it.dv} DV` : " †"}`,
        source: old?.source || null,
        description: desc(it),
        displayOrder: order++,
      },
    });
  }

  // pack size on the variant
  if (c.packSize && pack90) {
    for (const v of p.variants) {
      await prisma.variantAttributeValue.deleteMany({ where: { variantId: v.id, attributeValue: { attributeId: attr.id } } });
      await prisma.variantAttributeValue.create({ data: { variantId: v.id, attributeValueId: pack90.id } });
    }
  }
  console.log("updated", slug);

  // the QR verification page shows the same facts
  const ver = before.verifications.find((v) => v.productSlug === slug);
  if (ver) {
    const oldIng = Array.isArray(ver.ingredients) ? ver.ingredients : [];
    const packLabel = c.packSize ? "90 Capsules" : "60 Capsules";
    await prisma.verification.update({
      where: { id: ver.id },
      data: {
        tagline: c.tagline,
        shortDescription: c.text,
        features: [packLabel, c.serving.replace(/\b([a-z])/g, (m) => m.toUpperCase()), "With a Meal"],
        ingredients: c.ingredients.map((it) => {
          const old = it.keep ? oldIng.find((o) => it.keep.test(o.name || "")) : null;
          return { name: it.name, amount: `${it.amount}${it.dv !== "†" ? ` · ${it.dv} DV` : " †"}`, origin: old?.origin || "", description: desc(it) };
        }),
      },
    });
  }
}

// 3. Titan Force is taken off the website (kept in the database, switched off) -------------------
await prisma.product.updateMany({ where: { slug: "titan-force" }, data: { isActive: false } });
console.log("titan-force hidden");

// 4. blog: remove the "Pending Professional Review" line ---------------------------------------
const blog = await prisma.blogPost.updateMany({ where: { reviewedBy: { contains: "Pending", mode: "insensitive" } }, data: { reviewedBy: null } });
console.log("blog review line removed from", blog.count, "posts");

// 5. company phone in FAQ answers --------------------------------------------------------------
for (const f of before.faqs) {
  if (/562[\s.-]*524[\s.-]*3557/.test(f.answer)) {
    await prisma.fAQ.update({ where: { id: f.id }, data: { answer: f.answer.replace(/\(?562\)?[\s.-]*524[\s.-]*3557/g, "800-814-4477") } });
    console.log("faq phone updated:", f.question);
  }
}

await prisma.$disconnect();
console.log("done");
