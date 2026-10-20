import { entityMetadata } from "@/lib/seo-meta";

export async function generateMetadata({ params }) {
  return entityMetadata({
    section: "subcategory",
    slug: params.slug,
    apiPath: `/public/subcategories/${params.slug}/products?limit=1`,
    keys: ["subcategory", "subCategory", "category"],
    suffix: " | Shop Supplements",
  });
}

export default function Layout({ children }) {
  return children;
}
