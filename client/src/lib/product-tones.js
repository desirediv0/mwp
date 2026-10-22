// Soft colour per formula, used behind the bottle on product cards and pages
export const PRODUCT_TONES = {
  "ultra-pro": { background: "#f8f4e9", surface: "#f1e2b7", deep: "#c7ae6c", accent: "#806326", line: "#e5d9b8" },
  "power-max": { background: "#f0f3f9", surface: "#cdd8ee", deep: "#8398bf", accent: "#405d91", line: "#d2dced" },
  "rapid-boost": { background: "#fbefeb", surface: "#efc7bc", deep: "#ba7970", accent: "#a4483c", line: "#eed3ca" },
  "her-power": { background: "#f7efeb", surface: "#e5c3b7", deep: "#a77b74", accent: "#a36855", line: "#ead3c9" },
  "her-energy": { background: "#f5f0f9", surface: "#ded0eb", deep: "#a18ab7", accent: "#72568b", line: "#e0d3e9" },
  "daily-vitality": { background: "#f4f4ed", surface: "#dddfc7", deep: "#a0a786", accent: "#657341", line: "#dce0cb" },
  "alpha-prime": { background: "#f8f0e8", surface: "#e8ceb1", deep: "#b68b68", accent: "#8a5e37", line: "#e7d5c2" },
  "titan-force": { background: "#faf1e9", surface: "#edcfb4", deep: "#ba855d", accent: "#975e32", line: "#ebd5c2" },
};

const FALLBACK = { background: "#faf8f2", surface: "#f1e2b7", deep: "#c7ae6c", accent: "#a8741f", line: "#e6dfc9" };

export const getProductTone = (slug) => PRODUCT_TONES[slug] || FALLBACK;

const decode = (s) =>
  String(s)
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;|&#39;/g, "’")
    .replace(/&quot;/g, '"');

// "Power For Your Everyday." from the first <h2> of the description, else the first sentence
export function productTagline(product) {
  const html = String(product?.shortDescription || product?.description || "");
  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2) return decode(h2[1].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  const text = decode(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  const first = text.split(/(?<=[.!?])\s/)[0] || text;
  return first.length > 90 ? `${first.slice(0, 87)}...` : first;
}

// A longer blurb for the card: first paragraph, trimmed
export function productBlurb(product, max = 110) {
  const html = String(product?.shortDescription || product?.description || "");
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const text = decode((p ? p[1] : html).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text;
}
