import { fetchApi } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PAGES = [
  ["/", 1.0, "daily"],
  ["/products", 0.9, "daily"],
  ["/categories", 0.6, "weekly"],
  ["/bundles", 0.6, "weekly"],
  ["/ingredients", 0.7, "monthly"],
  ["/university", 0.7, "weekly"],
  ["/certificates", 0.6, "monthly"],
  ["/quiz", 0.5, "monthly"],
  ["/about", 0.5, "monthly"],
  ["/founder", 0.4, "monthly"],
  ["/why-us", 0.4, "monthly"],
  ["/faqs", 0.5, "monthly"],
  ["/contact", 0.5, "monthly"],
  ["/shipping-policy", 0.4, "yearly"],
  ["/return-policy", 0.4, "yearly"],
  ["/privacy-policy", 0.3, "yearly"],
  ["/terms", 0.3, "yearly"],
];

async function list(path, pick) {
  try {
    const res = await fetchApi(path);
    return pick(res?.data) || [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [products, categories, posts, bundles] = await Promise.all([
    list("/public/products?limit=500", (d) => d?.products),
    list("/public/categories", (d) => (Array.isArray(d) ? d : d?.categories)),
    list("/content/blog?limit=500", (d) => d?.posts),
    list("/bundles", (d) => (Array.isArray(d) ? d : d?.bundles || d?.campaigns)),
  ]);

  const now = new Date();
  const entries = STATIC_PAGES.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: now, changeFrequency, priority }));
  for (const p of products) if (p.slug) entries.push({ url: absoluteUrl(`/products/${p.slug}`), lastModified: p.updatedAt ? new Date(p.updatedAt) : now, changeFrequency: "weekly", priority: 0.9 });
  for (const c of categories) if (c.slug) entries.push({ url: absoluteUrl(`/category/${c.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  for (const b of bundles) if (b.slug) entries.push({ url: absoluteUrl(`/bundles/${b.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.5 });
  for (const post of posts) if (post.slug) entries.push({ url: absoluteUrl(`/university/${post.slug}`), lastModified: post.updatedAt ? new Date(post.updatedAt) : now, changeFrequency: "monthly", priority: 0.6 });
  return entries;
}
