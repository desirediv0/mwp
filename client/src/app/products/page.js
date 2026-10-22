import { fetchApi } from "@/lib/utils";
import { absoluteUrl, jsonLd, plainText } from "@/lib/seo";
import ProductsShop from "./ProductsShop";

export const revalidate = 300;

const SORTS = ["featured", "price-asc", "price-desc", "name"];
const one = (v) => (Array.isArray(v) ? v[0] : v);

export default async function ProductsPage({ searchParams }) {
  let products = [];
  let categories = [];
  let failed = false;

  try {
    const [p, c] = await Promise.all([fetchApi("/public/products?limit=100"), fetchApi("/public/categories").catch(() => null)]);
    products = p?.data?.products || [];
    categories = Array.isArray(c?.data) ? c.data : c?.data?.categories || [];
  } catch {
    failed = true;
  }

  const initial = {
    category: String(one(searchParams?.category) || "all").toLowerCase(),
    search: String(one(searchParams?.search) || "").slice(0, 80),
    sort: SORTS.includes(one(searchParams?.sort)) ? one(searchParams.sort) : "featured",
    page: Math.max(1, parseInt(one(searchParams?.page), 10) || 1),
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MWP Supplements formulas",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
      description: plainText(p.description).slice(0, 160),
    })),
  };

  return (
    <>
      {products.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(listLd) }} />}
      <ProductsShop products={products} categories={categories} initial={initial} failed={failed} />
    </>
  );
}
