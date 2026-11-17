import { prisma } from "../config/db.js";

// First-time setup of wholesale packs from the client's sample sheet (MWP-Wholesale-NextJS/config.ts).
// The prices are the client's TEMPORARY placeholders; change them in Admin → Wholesale → Products.
// Only products that have no wholesale packs yet are touched, so re-running is safe.
const bottle = (detail, price) => ({ type: "bottle", label: "Bottle Box", contains: "6 bottles per box", detail, unit: "bottle", units: 6, price });
const b15 = (price) => ({ type: "blister", label: "Blister Box", contains: "10 blister packs per box", detail: "1 pack = 15-day serving", unit: "pack", units: 10, price });
const b1 = (price) => ({ type: "blister", label: "Blister Box", contains: "24 blisters per box", detail: "1 blister = 3 capsules · 1-day serving", unit: "blister", units: 24, price });

const PLAN = {
  "her-power": [bottle("90 capsules per bottle", 120), b15(100)],
  "daily-vitality": [bottle("60 capsules per bottle", 90), b15(75)],
  "power-max": [bottle("90 capsules per bottle", 120), b1(42)],
  "rapid-boost": [bottle("90 capsules per bottle", 135), b1(48)],
  "alpha-prime": [b1(54)],
  "ultra-pro": [b1(54)],
};

for (const [slug, packs] of Object.entries(PLAN)) {
  const p = await prisma.product.findFirst({ where: { slug, isDeleted: false }, select: { id: true, _count: { select: { wholesalePacks: true } } } });
  if (!p) { console.log("missing product:", slug); continue; }
  if (p._count.wholesalePacks > 0) { console.log("kept existing packs:", slug); continue; }
  await prisma.wholesalePack.createMany({ data: packs.map((k, i) => ({ ...k, order: i, productId: p.id })) });
  await prisma.product.update({ where: { id: p.id }, data: { wholesaleEnabled: true } });
  console.log("wholesale packs added:", slug, packs.length);
}
await prisma.$disconnect();
