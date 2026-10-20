import { entityMetadata } from "@/lib/seo-meta";

export async function generateMetadata({ params }) {
  return entityMetadata({
    section: "brand",
    slug: params.slug,
    apiPath: `/public/brand/${params.slug}?limit=1`,
    keys: ["brand"],
    suffix: " | Shop Supplements",
  });
}

export default function Layout({ children }) {
  return children;
}
