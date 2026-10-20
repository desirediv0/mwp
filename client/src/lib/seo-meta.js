import { fetchApi } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

const plain = (html = "") => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const titleCase = (slug) => String(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Builds page metadata for a "/<section>/<slug>" page from whatever the API returns for it.
export async function entityMetadata({ section, slug, apiPath, keys = [], suffix = "", fallbackDescription }) {
  let entity = null;
  try {
    const res = await fetchApi(apiPath);
    const data = res?.data || {};
    for (const k of keys) {
      if (data[k]) {
        entity = data[k];
        break;
      }
    }
  } catch {
    /* fall back to the slug */
  }
  const name = entity?.name || entity?.title || titleCase(slug);
  const title = entity?.metaTitle || `${name}${suffix}`;
  const description = (entity?.metaDescription || plain(entity?.description) || fallbackDescription || `Shop ${name} from MWP Supplements. Clean, lab-tested wellness formulas shipped across the USA.`).slice(0, 160);
  const url = absoluteUrl(`/${section}/${slug}`);
  const image = entity?.image || entity?.imageUrl || entity?.bannerUrl || null;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: "MWP SUPPLEMENTS", images: image ? [{ url: image, alt: name }] : [] },
  };
}
