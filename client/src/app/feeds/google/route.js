import { fetchApi } from "@/lib/utils";
import { absoluteUrl, plainText } from "@/lib/seo";

// Google Merchant Center product feed (RSS 2.0 with the g: namespace).
// Add https://<your-domain>/feeds/google in Merchant Center > Products > Feeds (scheduled fetch).
export const revalidate = 3600;

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const plain = plainText;
const imageUrl = (img) => (!img ? null : img.startsWith("http") ? img : `https://desirediv-storage.blr1.digitaloceanspaces.com/${img}`);
const money = (n) => `${(Math.round(parseFloat(n) * 100) / 100).toFixed(2)} USD`;

async function safe(path) {
  try {
    return (await fetchApi(path))?.data;
  } catch {
    return null;
  }
}

export async function GET() {
  const list = (await safe("/public/products?limit=500"))?.products || [];
  const details = await Promise.all(list.map((p) => safe(`/public/products/${p.slug}`).then((d) => d?.product).catch(() => null)));
  const items = [];

  for (const p of details.filter(Boolean)) {
    const variants = (p.variants || []).filter((v) => v.isActive);
    const images = (p.images || []).map((i) => imageUrl(i.url)).filter(Boolean);
    if (!variants.length || !images.length) continue;
    const description = (plain(p.description || p.shortDescription) || p.name).slice(0, 4900);

    for (const v of variants) {
      const regular = parseFloat(v.price);
      const sale = v.salePrice ? parseFloat(v.salePrice) : null;
      if (!(regular > 0)) continue;
      const stock = v.stock ?? v.quantity ?? 0;
      const options = (v.attributes || []).map((a) => a.attributeValue?.value).filter(Boolean);
      const title = [p.name, ...options].join(" - ").slice(0, 150);
      items.push(`    <item>
      <g:id>${esc(v.sku || v.id)}</g:id>
      <g:item_group_id>${esc(p.id)}</g:item_group_id>
      <title>${esc(title)}</title>
      <description>${esc(description)}</description>
      <link>${esc(absoluteUrl(`/products/${p.slug}`))}</link>
      <g:image_link>${esc(images[0])}</g:image_link>
${images.slice(1, 6).map((u) => `      <g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("\n")}
      <g:availability>${stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:price>${money(regular)}</g:price>
${sale && sale < regular ? `      <g:sale_price>${money(sale)}</g:sale_price>\n` : ""}      <g:brand>MWP SUPPLEMENTS</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>525</g:google_product_category>
      <g:product_type>Dietary Supplements</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MWP SUPPLEMENTS</title>
    <link>${esc(absoluteUrl("/"))}</link>
    <description>MWP SUPPLEMENTS product feed</description>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
