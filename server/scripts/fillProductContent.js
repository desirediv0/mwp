import { prisma } from "../config/db.js";

// Fills product fields that are still empty. Never overwrites existing content.
// Wording comes from each product's own label/copy and the brand trust claims.
// Alpha Prime / Titan Force: label claims only (no doses or ingredients are invented).
const LEGAL =
  "<p>Manufactured in a cGMP-compliant facility registered with the U.S. FDA. Third-party lab tested. Vegan. Non-GMO. Made in the USA with globally sourced ingredients.</p>" +
  "<p>These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure or prevent any disease.</p>";

const H = (title, text) => ({ title, text });

const CONTENT = {
  "ultra-pro": {
    bestFor: "Men who want daily energy, drive and performance support",
    keywords: "MWP Ultra Pro, men's supplement, energy, drive, performance, vitality, dietary supplement",
  },
  "power-max": {
    bestFor: "Men focused on pump, endurance and muscular output",
    keywords: "MWP Power Max, men's supplement, pump, endurance, muscle, performance, dietary supplement",
  },
  "rapid-boost": {
    bestFor: "Men who want blood flow, stamina and pre-activity readiness",
    keywords: "MWP Rapid Boost, men's supplement, blood flow, stamina, pre-workout, dietary supplement",
  },
  "her-power": {
    bestFor: "Women looking for hormone balance, energy and everyday vitality support",
    keywords: "MWP Her Power, women's supplement, hormone balance, energy, vitality, dietary supplement",
  },
  "her-energy": {
    bestFor: "Women who want energy, stress resilience and everyday vitality",
    keywords: "MWP Her Energy, women's supplement, energy, stress resilience, vitality, dietary supplement",
  },
  "daily-vitality": {
    bestFor: "Anyone building a daily routine for cellular energy, metabolism and immune support",
    keywords: "MWP Daily Vitality, daily wellness, cellular energy, metabolism, immune support, dietary supplement",
  },
  "alpha-prime": {
    bestFor: "Men focused on strength, lean muscle, drive and focus",
    keywords: "MWP Alpha Prime, men's supplement, testosterone support, strength, lean muscle, focus, dietary supplement",
    description:
      "<h2>Strength. Focus. Performance.</h2><p>Alpha Prime is MWP’s Testosterone &amp; Performance Formula for men, made to support testosterone, strength, lean muscle, and drive and focus. 60 capsules per bottle.</p>",
    mainBenefits: "Alpha Prime supports testosterone, strength, lean muscle, and drive and focus.",
    servingSize: "Follow the directions on the product label",
    highlights: [
      H("Testosterone Support", "Supports testosterone"),
      H("Strength", "Enhances strength"),
      H("Lean Muscle", "Supports lean muscle"),
      H("Drive & Focus", "Supports drive and focus"),
    ],
  },
  "titan-force": {
    bestFor: "Men focused on strength, endurance and power",
    keywords: "MWP Titan Force, men's supplement, strength, endurance, lean muscle, power, dietary supplement",
    description:
      "<h2>Power For Your Everyday.</h2><p>Titan Force is MWP’s Maximum Performance Formula for men, made to boost strength and support endurance, lean muscle and power. 60 capsules per bottle.</p>",
    mainBenefits: "Titan Force boosts strength and supports endurance, lean muscle and power.",
    servingSize: "Follow the directions on the product label",
    highlights: [
      H("Strength", "Boosts strength"),
      H("Endurance", "Enhances endurance"),
      H("Lean Muscle", "Supports lean muscle"),
      H("Power", "Increases power"),
    ],
  },
};

const isEmpty = (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

async function main() {
  for (const [slug, fill] of Object.entries(CONTENT)) {
    const p = await prisma.product.findFirst({ where: { slug } });
    if (!p) {
      console.log(`? ${slug}: not found`);
      continue;
    }
    const wanted = { ...fill, legalInfo: LEGAL };
    const data = {};
    for (const [k, v] of Object.entries(wanted)) {
      if (isEmpty(p[k])) data[k] = v;
    }
    // Alpha Prime / Titan Force: replace the one-line auto description only
    if ((slug === "alpha-prime" || slug === "titan-force") && /^<h2>[^<]*<\/h2><p>MWP [A-Z ]+\. 60 capsules per bottle\.<\/p>$/.test(p.description || "")) {
      data.description = fill.description;
    }
    if (Object.keys(data).length) {
      await prisma.product.update({ where: { id: p.id }, data });
      console.log(`+ ${slug}: ${Object.keys(data).join(", ")}`);
    } else {
      console.log(`= ${slug}: nothing to fill`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
