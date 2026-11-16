import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../config/db.js";
import s3client from "../utils/s3client.js";
import { getFileUrl, deleteFromS3 } from "../utils/deleteFromS3.js";

// Replaces the product photos of the 4 MWP formulas with the client's new 3D renders (Downloads/MWP_*_Product_Images).
//  - product gallery: 8 angles, transparent WebP (from the transparent PNG renders), in the suggested order (front first)
//  - home page / menus / compare: cutouts in client/public/products/cutouts (trimmed transparent PNG + WebP)
// Old gallery records are saved to server/backups/ first, then removed (database + storage).
// Run:  node scripts/setClientProductImages.js          (dry run)
//       node scripts/setClientProductImages.js --apply

const DOWNLOADS = path.join(process.env.USERPROFILE || "C:/Users/welcome", "Downloads");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const apply = process.argv.includes("--apply");

const PRODUCTS = [
  { slug: "power-max", folder: "MWP_PowerMax_Product_Images", name: "Power Max" },
  { slug: "rapid-boost", folder: "MWP_RapidBoost_Product_Images", name: "Rapid Boost" },
  { slug: "her-power", folder: "MWP_HerPower_Product_Images", name: "Her Power" },
  { slug: "daily-vitality", folder: "MWP_DailyVitality_Product_Images", name: "Daily Vitality" },
];
// 01 front, 02 front-right, 08 front-left, 06 back-left (Supplement Facts), 03 right-side, 05 back, 04, 07
const ORDER = [
  ["01-front", "front"],
  ["02-front-right", "front right"],
  ["08-front-left", "front left"],
  ["06-back-left", "back left, Supplement Facts"],
  ["03-right-side", "right side"],
  ["05-back", "back"],
  ["04-back-right", "back right"],
  ["07-left-side", "left side"],
];

// same crop for all 8 angles of a product (the bottle's overall bounding box + margin), 4:5 portrait like the shop cards
async function cropBox(p) {
  let l = 1e9, t = 1e9, rr = 0, b = 0;
  for (const [n] of ORDER) {
    const { info } = await sharp(path.join(dir(p), "1_transparent_png", `${p.slug}-${n}.png`)).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
    const x = -info.trimOffsetLeft, y = -info.trimOffsetTop;
    l = Math.min(l, x); t = Math.min(t, y); rr = Math.max(rr, x + info.width); b = Math.max(b, y + info.height);
  }
  const w = rr - l, h = b - t, cx = (l + rr) / 2, cy = (t + b) / 2;
  let cw = w * 1.12, ch = h * 1.1;
  if (cw / ch > 0.8) ch = cw / 0.8; else cw = ch * 0.8;
  cw = Math.min(Math.round(cw), 2000); ch = Math.min(Math.round(ch), 2000);
  return { left: Math.max(0, Math.min(2000 - cw, Math.round(cx - cw / 2))), top: Math.max(0, Math.min(2000 - ch, Math.round(cy - ch / 2))), width: cw, height: ch };
}

const dir = (p) => path.join(DOWNLOADS, p.folder, p.folder);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

try {
  const found = await prisma.product.findMany({
    where: { slug: { in: PRODUCTS.map((p) => p.slug) }, isDeleted: false },
    select: { id: true, slug: true, name: true, images: true, variants: { select: { id: true, images: true } } },
  });
  for (const p of PRODUCTS) {
    const rec = found.find((f) => f.slug === p.slug);
    if (!rec) throw new Error(`Product not found: ${p.slug}`);
    for (const [n] of ORDER) await fs.access(path.join(dir(p), "1_transparent_png", `${p.slug}-${n}.png`));
    await fs.access(path.join(dir(p), "1_transparent_png", `${p.slug}-01-front.png`));
    console.log(p.slug, "old gallery:", rec.images.length, "variant image rows:", rec.variants.reduce((a, v) => a + v.images.length, 0));
  }
  if (!apply) {
    console.log("Dry run OK. Pass --apply to upload, save and replace.");
  } else {
    await fs.mkdir(path.join(root, "server/backups"), { recursive: true });
    await fs.writeFile(path.join(root, "server/backups", `product-gallery-before-${stamp}.json`), JSON.stringify(found, null, 2));

    for (const p of PRODUCTS) {
      const rec = found.find((f) => f.slug === p.slug);

      // 1) cutouts for the home page, menu, compare page
      const png = path.join(dir(p), "1_transparent_png", `${p.slug}-01-front.png`);
      const base = sharp(png).trim({ threshold: 10 });
      const cutDir = path.join(root, "client/public/products/cutouts");
      await base.clone().resize({ height: 1400, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(path.join(cutDir, `${p.slug}.png`));
      await base.clone().resize({ height: 1400, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(cutDir, `${p.slug}.webp`));

      // 2) gallery: upload all 8 first, only then switch the database
      const uploaded = [];
      const box = await cropBox(p);
      for (const [i, [n, label]] of ORDER.entries()) {
        // transparent background, so the bottle sits on the card / gallery colour instead of a white square
        const body = await sharp(path.join(dir(p), "1_transparent_png", `${p.slug}-${n}.png`)).extract(box).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toBuffer();
        const key = `${process.env.UPLOAD_FOLDER || "mwp"}/products/${stamp}-${p.slug}-${n}.webp`;
        await s3client.send(new PutObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: key, Body: body, ContentType: "image/webp", ACL: "public-read" }));
        const res = await fetch(getFileUrl(key), { method: "HEAD" });
        if (!res.ok) throw new Error(`Upload not readable: ${key} (${res.status})`);
        uploaded.push({ key, order: i, alt: `${p.name} bottle, ${label}` });
      }
      await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId: rec.id } });
        await tx.productImage.createMany({
          data: uploaded.map((u) => ({ productId: rec.id, url: u.key, alt: u.alt, isPrimary: u.order === 0, order: u.order })),
        });
      });
      console.log("Done:", p.slug, "->", uploaded.length, "images");

      // 3) remove the old files from storage (best effort; records are already replaced)
      for (const old of rec.images) {
        try { await deleteFromS3(old.url); } catch (e) { console.log("  could not remove old file:", old.url, e.message); }
      }
    }
  }
} finally {
  await prisma.$disconnect();
}
