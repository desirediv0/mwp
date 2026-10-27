import crypto from "crypto";
import { prisma } from "../config/db.js";

// Creates a verification record (permanent code + public /verify/<code> page) for every real product
// that does not have one yet. Only data that already exists on the product is used: name, slug, image,
// description and pack size. Ingredients, batch, COA and origin are left empty on purpose: the admin
// fills them in later, and the same printed QR then shows the new details.

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I ambiguity
const makeCode = () => {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `MWP-${s}`;
};

async function uniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = makeCode();
    if (!(await prisma.verification.findUnique({ where: { verificationCode: code } }))) return code;
  }
  throw new Error("Could not generate a unique verification code");
}

const decode = (t) =>
  t
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

// "<p>Power For Your Everyday.</p><p>Titan Force is ...</p>" -> { tagline, shortDescription }
export function splitDescription(html) {
  const blocks = (String(html || "").match(/<(p|h[1-6]|li)[^>]*>[\s\S]*?<\/\1>/gi) || [])
    .map((b) => decode(b.replace(/<[^>]+>/g, " ")))
    .filter(Boolean);
  const plain = blocks.length ? blocks : [decode(String(html || "").replace(/<[^>]+>/g, " "))].filter(Boolean);
  if (plain.length > 1 && plain[0].length <= 90) {
    return { tagline: plain[0], shortDescription: plain.slice(1).join(" ") };
  }
  return { tagline: null, shortDescription: plain.join(" ") || null };
}

const titleCase = (s) => String(s).replace(/\b([a-z])/g, (m) => m.toUpperCase());

export async function createMissingVerifications({ createdBy = null } = {}) {
  const products = await prisma.product.findMany({
    where: { isDeleted: false, verifications: { none: {} } },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { select: { attributes: { select: { attributeValue: { select: { value: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const created = [];
  for (const p of products) {
    const { tagline, shortDescription } = splitDescription(p.description);
    const features = [
      ...new Set(
        p.variants.flatMap((v) => v.attributes.map((a) => titleCase(a.attributeValue.value))).filter(Boolean)
      ),
    ];
    const record = await prisma.verification.create({
      data: {
        verificationCode: await uniqueCode(),
        productId: p.id,
        productName: p.name.replace(/[™®]/g, "").trim(),
        productSlug: p.slug,
        productImage: p.images[0]?.url || null,
        tagline,
        shortDescription,
        features,
        createdBy,
        updatedBy: createdBy,
      },
    });
    await prisma.verificationAuditLog
      .create({ data: { verificationId: record.id, action: "CREATED", detail: "Created from the product catalog", performedBy: createdBy } })
      .catch(() => {});
    created.push(record);
  }
  return created;
}
