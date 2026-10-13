import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "../config/db.js";
import { processAndUploadImage } from "../middlewares/multer.middlerware.js";

// Uploads the brand logo images (from a local folder) to storage and attaches them
// to the matching certificate cards. Logos are resized (max 480px) as PNG to stay light.
// Run: node -r dotenv/config scripts/seedCertificateLogos.js "C:\Users\welcome\Downloads"
const DIR = process.argv[2] || "C:\\Users\\welcome\\Downloads";

const MAP = [
  { title: "FDA Facility Registration", file: "fda-logo.png" },
  { title: "cGMP Compliance", file: "cGMP-compliance.jfif" },
  { title: "Certificate of Analysis", file: "third-party-lab-tested.jpg" },
  { title: "Non-GMO Documentation", file: "non-gmo.png" },
  { title: "Halal Certification", file: "halal-certification.png" },
  { title: "Quality Documentation", file: "quality-standard.png" },
];

async function main() {
  for (const { title, file } of MAP) {
    const card = await prisma.certificate.findFirst({ where: { title } });
    if (!card) {
      console.log(`? no card: ${title}`);
      continue;
    }
    const full = path.join(DIR, file);
    if (!fs.existsSync(full)) {
      console.log(`? missing file: ${full}`);
      continue;
    }
    const buffer = await sharp(fs.readFileSync(full))
      .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const key = await processAndUploadImage(
      { originalname: `${path.parse(file).name}.png`, buffer, mimetype: "image/png" },
      "certificate-logos"
    );
    await prisma.certificate.update({ where: { id: card.id }, data: { logoUrl: key } });
    console.log(`+ ${title}: ${key}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
