import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "../config/db.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

// Brand logos -> certificate cards. Background (black or light grey) is removed so the
// logos sit cleanly on the card. Circular badges are cut with a clean circular mask;
// the flag badge and the license plate use an edge flood-fill.
// Run: node -r dotenv/config scripts/seedCertificateLogosV2.js "C:\Users\welcome\Downloads"
const DIR = process.argv[2] || "C:\\Users\\welcome\\Downloads";
const W = (n) => `WhatsApp Image 2026-10-13 at ${n}.jpeg`;

const LOGOS = [
  { key: "fda", file: "__db__", mode: "circle" },
  { key: "vegan", file: W("10.55.36 AM"), mode: "circle" },
  { key: "nongmo", file: W("10.55.37 AM"), mode: "circle" },
  { key: "usa", file: W("10.55.37 AM (1)"), mode: "flood" },
  { key: "gmp", file: W("10.55.37 AM (2)"), mode: "circle" },
  { key: "third", file: W("10.55.37 AM (3)"), mode: "circle" },
  { key: "seller", file: W("10.55.38 AM"), mode: "circle" },
  { key: "license", file: W("10.55.38 AM (1)"), mode: "flood" },
];

const CARDS = [
  { match: "FDA Facility Registration", logo: "fda", order: 0 },
  { match: "cGMP Compliance", logo: "gmp", order: 1 },
  { match: "Certificate of Analysis", logo: "third", order: 2, heading: "Third-Party Lab Tested" },
  { match: "Non-GMO Documentation", logo: "nongmo", order: 3 },
  {
    match: "Vegan Certification", logo: "vegan", order: 4, create: true,
    heading: "Vegan", description: "Information about our vegan, plant-based formulas.", buttonLabel: "View document",
  },
  {
    match: "Made in USA", logo: "usa", order: 5, create: true,
    heading: "Made in USA", description: "Manufactured in the USA with globally sourced ingredients.", buttonLabel: "View document",
  },
  {
    match: "California Seller's Permit", logo: "seller", order: 6, create: true,
    heading: "Seller's Permit", description: "California-registered seller's permit documentation.", buttonLabel: "View document",
  },
  {
    match: "Business License", logo: "license", order: 7, create: true,
    heading: "Business License", description: "Licensed business documentation.", buttonLabel: "View document",
  },
];

// Not part of the brand's confirmed set -> hidden (kept in admin, can be switched back on).
const HIDE = ["Halal Certification", "Quality Documentation"];

async function cutout(file, mode) {
  let source = path.join(DIR, file);
  if (file === "__db__") {
    const card = await prisma.certificate.findFirst({ where: { title: "FDA Facility Registration" } });
    const res = await fetch(`https://desirediv-storage.blr1.cdn.digitaloceanspaces.com/${card.logoUrl}`);
    source = Buffer.from(await res.arrayBuffer());
  }
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;

  // background colour = average of the four corners
  const corners = [px(2, 2), px(w - 3, 2), px(2, h - 3), px(w - 3, h - 3)];
  const bg = [0, 1, 2].map((c) => corners.reduce((s, i) => s + data[i + c], 0) / 4);
  const dist = (i) => Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
  const dark = bg[0] + bg[1] + bg[2] < 200;

  if (mode === "circle") {
    const T = dark ? 38 : 34;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (dist(px(x, y)) > T) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const r = Math.min(maxX - minX, maxY - minY) / 2 - 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - cx, y - cy);
        const a = Math.max(0, Math.min(1, r + 0.5 - d)); // 1px soft edge
        data[px(x, y) + 3] = Math.round(255 * a);
      }
    }
  } else {
    // flood-fill the background in from the image border
    const T = dark ? 30 : 14;
    const seen = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      const k = y * w + x;
      if (!seen[k] && dist(k * 4) <= T) {
        seen[k] = 1;
        stack.push(k);
      }
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const k = stack.pop();
      const x = k % w;
      const y = (k / w) | 0;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }
    for (let k = 0; k < w * h; k++) {
      if (seen[k]) data[k * 4 + 3] = 0;
    }
    // soften the outline by one pixel
    const edge = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const k = y * w + x;
        if (!seen[k] && (seen[k - 1] || seen[k + 1] || seen[k - w] || seen[k + w])) edge.push(k);
      }
    }
    for (const k of edge) data[k * 4 + 3] = 120;
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .resize({ width: 520, height: 520, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
}

async function main() {
  const urls = {};
  for (const l of LOGOS) {
    const buffer = await cutout(l.file, l.mode);
    urls[l.key] = await processAndUploadImage(
      { originalname: `${l.key}.png`, buffer, mimetype: "image/png" },
      "certificate-logos"
    );
    console.log(`uploaded ${l.key}: ${urls[l.key]}`);
  }

  for (const c of CARDS) {
    let card = await prisma.certificate.findFirst({ where: { title: c.match } });
    if (!card && c.create) {
      card = await prisma.certificate.create({
        data: { title: c.match, heading: c.heading, description: c.description, buttonLabel: c.buttonLabel, displayOrder: c.order, isActive: true },
      });
      console.log(`+ created card: ${c.match}`);
    }
    if (!card) {
      console.log(`? missing card: ${c.match}`);
      continue;
    }
    if (card.logoUrl) await deleteFromS3(card.logoUrl).catch(() => {});
    const data = { logoUrl: urls[c.logo], displayOrder: c.order, isActive: true };
    if (c.heading && !card.heading) data.heading = c.heading;
    if (c.heading && c.match === "Certificate of Analysis") data.heading = c.heading;
    await prisma.certificate.update({ where: { id: card.id }, data });
    console.log(`= ${c.match} -> ${c.logo}`);
  }

  for (const title of HIDE) {
    const card = await prisma.certificate.findFirst({ where: { title } });
    if (!card) continue;
    if (card.logoUrl) await deleteFromS3(card.logoUrl).catch(() => {});
    await prisma.certificate.update({ where: { id: card.id }, data: { isActive: false, logoUrl: null, displayOrder: 20 } });
    console.log(`- hidden: ${title}`);
  }

  const fda = await prisma.certificate.findFirst({ where: { title: "FDA Facility Registration" } });
  if (fda) await prisma.certificate.update({ where: { id: fda.id }, data: { displayOrder: 0 } });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
