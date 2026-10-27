// Shared SEO helpers: one place for the public site address and absolute URLs.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mwpsupplements.com").replace(/\/$/, "");
export const SITE_NAME = "MWP SUPPLEMENTS";

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// JSON-LD must not be able to close the script tag
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MWP Supplements LLC",
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/mwp-logo-3.png`,
  email: "support@mwpsupplements.com",
  telephone: "+1-562-524-3557",
  address: {
    "@type": "PostalAddress",
    streetAddress: "531 Main Street, PMB 1127",
    addressLocality: "El Segundo",
    addressRegion: "CA",
    postalCode: "90245",
    addressCountry: "US",
  },
  contactPoint: { "@type": "ContactPoint", telephone: "+1-562-524-3557", contactType: "customer service", areaServed: "US", availableLanguage: "English" },
};

const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " ", "&rsquo;": "’", "&lsquo;": "‘" };
// HTML to clean text (tags removed, entities decoded, whitespace collapsed)
export const plainText = (html = "") =>
  String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp|rsquo|lsquo);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();
