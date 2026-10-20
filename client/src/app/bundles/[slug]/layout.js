import { entityMetadata } from "@/lib/seo-meta";

export async function generateMetadata({ params }) {
  return entityMetadata({
    section: "bundles",
    slug: params.slug,
    apiPath: `/bundles/${params.slug}`,
    keys: ["bundle", "campaign"],
    suffix: " | Supplement Bundle",
  });
}

export default function Layout({ children }) {
  return children;
}
