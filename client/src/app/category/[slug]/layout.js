import { entityMetadata } from "@/lib/seo-meta";

export async function generateMetadata({ params }) {
  return entityMetadata({
    section: "category",
    slug: params.slug,
    apiPath: `/public/categories/${params.slug}/products?limit=1`,
    keys: ["category"],
    suffix: " | Shop Supplements",
  });
}

export default function Layout({ children }) {
  return children;
}
