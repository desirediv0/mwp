import { prisma } from "../config/db.js";
import { decrypt } from "./encryption.js";

export async function getTrackingSettings() {
  let s = await prisma.trackingSettings.findFirst();
  if (!s) s = await prisma.trackingSettings.create({ data: {} });
  return s;
}

// What the storefront needs to load the tags (never includes the Conversions API token)
export async function getPublicTrackingConfig() {
  const s = await getTrackingSettings();
  return {
    googleAnalyticsId: s.googleAnalyticsId || null,
    googleTagManagerId: s.googleTagManagerId || null,
    googleSiteVerification: s.googleSiteVerification || null,
    metaPixelId: s.metaPixelId || null,
  };
}

// Meta Conversions API credentials: saved in the admin panel first, server env as a fallback
export async function getMetaCapiConfig() {
  const s = await getTrackingSettings();
  let token = null;
  if (s.metaCapiToken) {
    try {
      token = decrypt(s.metaCapiToken);
    } catch {
      token = null;
    }
  }
  return {
    pixelId: s.metaPixelId || process.env.META_PIXEL_ID || null,
    token: token || process.env.META_CAPI_TOKEN || null,
    testEventCode: s.metaTestEventCode || process.env.META_TEST_EVENT_CODE || null,
  };
}
