import { prisma } from "../config/db.js";
import slugify from "slugify";

/**
 * Seeds the 32 MWP ingredients with their simple benefit descriptions.
 * Images are left null — the MWP team uploads approved raw-form images
 * later from the admin panel (Ingredients section).
 *
 * Run:  npm run seed:ingredients
 * Safe to re-run — existing ingredients (by name) are updated, not duplicated.
 */

const INGREDIENTS = [
  ["L-Citrulline Free-Form", "Supports blood flow, stamina and physical performance."],
  ["Fenugreek Extract", "Supports healthy testosterone levels, strength and libido."],
  ["Cordyceps CS-4 Extract", "Supports energy, stamina and endurance."],
  ["Magnesium Glycinate", "Supports muscle recovery, relaxation and restful sleep."],
  ["Rhodiola Rosea", "Supports energy, focus and stress control."],
  ["Black Maca Extract", "Supports energy, stamina, libido and vitality."],
  ["Panax Red Ginseng", "Supports energy, focus, stamina and sexual vitality."],
  ["Pomegranate Extract", "Supports blood flow, heart health and antioxidant protection."],
  ["Quercetin Phytosome", "Supports immunity, antioxidant protection and healthy aging."],
  ["Boron Glycinate", "Supports healthy testosterone levels, strong bones and vitamin D use."],
  ["KSM-66 Ashwagandha", "Supports stress control, strength, energy and healthy testosterone levels."],
  ["Myo-Inositol", "Supports hormonal balance, ovarian health and healthy metabolism."],
  ["NMN", "Supports cellular energy, daily vitality and healthy aging."],
  ["Berberine Phytosome", "Supports healthy metabolism and healthy blood-sugar levels."],
  ["Shatavari Extract", "Supports women's hormonal balance, energy and reproductive wellness."],
  ["CoQ10 Ubiquinol", "Supports energy, heart health and physical performance."],
  ["Horny Goat Weed", "Supports libido, blood flow and sexual performance."],
  ["Zinc Bisglycinate", "Supports immunity, reproductive health and healthy testosterone levels."],
  ["Iron Bisglycinate", "Supports healthy iron levels, energy and red-blood-cell production."],
  ["Tongkat Ali Root Extract", "Supports healthy testosterone levels, libido, energy and male vitality."],
  ["Vitamin K2 MK-7", "Supports strong bones, heart health and healthy calcium use."],
  ["Chromium Picolinate", "Supports healthy metabolism and normal blood-sugar control."],
  ["Selenium", "Supports thyroid health, antioxidant protection and reproductive wellness."],
  ["D-Chiro Inositol", "Supports hormonal balance, ovarian function and healthy metabolism."],
  ["Black Pepper Extract / Piperine", "Supports better absorption of other ingredients."],
  ["Vitamin B6 P-5-P", "Supports energy, mood and hormonal balance."],
  ["Vitamin B12 Methylcobalamin", "Supports energy, nerves and red-blood-cell production."],
  ["L-Citrulline Malate 2:1", "Supports blood flow, workout performance and endurance."],
  ["French Maritime Pine Bark Extract", "Supports circulation, antioxidant protection and physical performance."],
  ["L-Arginine", "Supports blood flow, workout pump and performance."],
  ["Purified Shilajit", "Supports energy, stamina, strength and male vitality."],
  ["Vitamin D3", "Supports immunity, strong bones, mood and healthy testosterone levels."],
];

async function seed() {
  console.log("Seeding 32 MWP ingredients…");
  let created = 0, updated = 0;
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const [name, benefit] = INGREDIENTS[i];
    const slug = slugify(name, { lower: true, strict: true }).slice(0, 80);
    const existing = await prisma.ingredient.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: { benefit, displayOrder: i + 1, isActive: true, slug },
      });
      updated++;
    } else {
      await prisma.ingredient.create({
        data: { name, slug, benefit, displayOrder: i + 1, isActive: true },
      });
      created++;
    }
  }
  console.log(`Done. ${created} created, ${updated} updated.`);
}

seed()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
