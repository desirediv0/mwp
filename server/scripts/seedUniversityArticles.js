// Adds (or updates) the MWP University articles and their cover images.
// Safe to run more than once: articles are matched by URL slug, and a cover image is only
// uploaded when the article does not have one yet (so images changed in the admin are kept).
//   node -r dotenv/config scripts/seedUniversityArticles.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prisma } from "../config/db.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";
import { UNIVERSITY_ARTICLES } from "./data/universityArticles.js";

const here = path.dirname(fileURLToPath(import.meta.url));

let category = await prisma.blogCategory.findUnique({ where: { slug: "ingredients" } });
if (!category) category = await prisma.blogCategory.create({ data: { name: "Ingredients", slug: "ingredients" } });
let guides = await prisma.blogCategory.findUnique({ where: { slug: "supplement-guides" } });
if (!guides) guides = await prisma.blogCategory.create({ data: { name: "Supplement Guides", slug: "supplement-guides" } });

const categoryFor = { "how-women-can-compare-wellness-supplement-formulas": guides };

for (const article of UNIVERSITY_ARTICLES) {
  const { slug, ...fields } = article;
  const cat = categoryFor[slug] || category;
  const existing = await prisma.blogPost.findUnique({ where: { slug } });

  let coverImage = existing?.coverImage || null;
  const coverFile = path.join(here, "data", "covers", `${slug}.jpg`);
  if (!coverImage && fs.existsSync(coverFile)) {
    try {
      coverImage = await processAndUploadImage({ originalname: `${slug}.jpg`, buffer: fs.readFileSync(coverFile) }, "blog");
    } catch (err) {
      console.error(`Cover upload failed for ${slug}: ${err.message}`);
    }
  }

  const data = { ...fields, isPublished: true, coverImage };
  const post = existing
    ? await prisma.blogPost.update({ where: { slug }, data: { ...data, categories: { set: [{ id: cat.id }] } } })
    : await prisma.blogPost.create({ data: { ...data, slug, categories: { connect: [{ id: cat.id }] } } });
  console.log(`${existing ? "Updated" : "Added"}: /university/${post.slug}${coverImage ? "  (cover image set)" : "  (no cover image)"}`);
}

await prisma.$disconnect();
process.exit(0);
