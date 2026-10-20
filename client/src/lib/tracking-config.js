import { API_URL } from "@/lib/utils";

// Tracking IDs are saved by the admin (Admin > Tracking) and read here on the server, cached for a minute.
// Env vars remain as a fallback so nothing breaks before the admin saves anything.
const FALLBACK = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || null,
  googleTagManagerId: process.env.NEXT_PUBLIC_GTM_ID || null,
  googleSiteVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION || null,
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
};

export async function getTrackingConfig() {
  try {
    const res = await fetch(`${API_URL.replace(/\/$/, "")}/tracking-config`, { next: { revalidate: 60 } });
    if (!res.ok) return FALLBACK;
    const json = await res.json();
    const d = json?.data || {};
    return {
      googleAnalyticsId: d.googleAnalyticsId || FALLBACK.googleAnalyticsId,
      googleTagManagerId: d.googleTagManagerId || FALLBACK.googleTagManagerId,
      googleSiteVerification: d.googleSiteVerification || FALLBACK.googleSiteVerification,
      metaPixelId: d.metaPixelId || FALLBACK.metaPixelId,
    };
  } catch {
    return FALLBACK;
  }
}
