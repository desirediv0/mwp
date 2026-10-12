import { prisma } from "../config/db.js";

// Default benefit cards, worded only from each product's own ingredient
// descriptions / main benefits (plus the Her Power cards supplied by the brand).
// Fills products whose highlights are still empty; admin can edit them later.
const H = (title, text) => ({ title, text });

const DEFAULTS = {
  "her-power": [
    H("Daily Wellness", "Supports women's daily wellness"),
    H("Energy Metabolism", "Supports normal energy metabolism"),
    H("Stress Response", "Supports a healthy stress response"),
    H("Bone & Muscle", "Supports bone and muscle health"),
  ],
  "ultra-pro": [
    H("Energy & Performance", "Supports energy, drive and everyday performance"),
    H("Stress Resilience", "Supports stress resilience and vitality"),
    H("Male Vitality", "Supports male vitality and drive"),
    H("Muscle, Immune & Bone", "Supports muscle, immune and bone health"),
  ],
  "power-max": [
    H("Muscle Pump", "Supports nitric oxide production and muscle pump"),
    H("Blood Flow", "Supports vascular health and blood flow"),
    H("Circulation", "Supports circulation and antioxidant defense"),
    H("Endurance", "Supports endurance and muscular output"),
  ],
  "rapid-boost": [
    H("Blood Flow", "Supports nitric oxide production and blood flow"),
    H("Energy & Stamina", "Supports energy, stamina and vitality"),
    H("Drive & Performance", "Supports drive, stamina and performance"),
    H("Circulation & Focus", "Supports circulation and cognitive function"),
  ],
  "her-energy": [
    H("Mental Energy", "Supports stress resilience and mental energy"),
    H("Stamina", "Supports stamina and energy production"),
    H("Energy Metabolism", "Supports energy metabolism and nervous system health"),
    H("Immune & Bone", "Supports immune and bone health"),
  ],
  "daily-vitality": [
    H("Cellular Energy", "Supports cellular energy production"),
    H("Stress & Vitality", "Supports stress resilience and everyday vitality"),
    H("Metabolism & Heart", "Supports healthy metabolism and cardiovascular health"),
    H("Immune & Bone", "Supports immune and bone health"),
  ],
};

async function main() {
  for (const [slug, highlights] of Object.entries(DEFAULTS)) {
    const p = await prisma.product.findFirst({ where: { slug }, select: { id: true, highlights: true } });
    if (!p) {
      console.log(`? ${slug}: not found`);
      continue;
    }
    if (Array.isArray(p.highlights) && p.highlights.length) {
      console.log(`= ${slug}: already has highlights, skipped`);
      continue;
    }
    await prisma.product.update({ where: { id: p.id }, data: { highlights } });
    console.log(`+ ${slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
