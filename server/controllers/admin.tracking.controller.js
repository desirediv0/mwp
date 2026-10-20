import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt, maskSecret } from "../utils/encryption.js";
import { getTrackingSettings, getPublicTrackingConfig } from "../utils/trackingSettings.js";

const safeMask = (value) => {
  if (!value) return null;
  try {
    return maskSecret(decrypt(value));
  } catch {
    return null;
  }
};

const present = (s) => ({
  googleAnalyticsId: s.googleAnalyticsId || "",
  googleTagManagerId: s.googleTagManagerId || "",
  googleSiteVerification: s.googleSiteVerification || "",
  metaPixelId: s.metaPixelId || "",
  metaCapiConfigured: !!s.metaCapiToken,
  metaCapiTokenMasked: safeMask(s.metaCapiToken),
  metaTestEventCode: s.metaTestEventCode || "",
  updatedAt: s.updatedAt,
});

// Each rule: [field, label, pattern, example]. An empty value removes the tag.
const RULES = [
  ["googleAnalyticsId", "Google Analytics ID", /^G-[A-Z0-9]{6,14}$/, "G-XXXXXXXXXX"],
  ["googleTagManagerId", "Google Tag Manager ID", /^GTM-[A-Z0-9]{4,10}$/, "GTM-XXXXXXX"],
  ["metaPixelId", "Meta Pixel ID", /^\d{8,20}$/, "1234567890123456"],
  ["googleSiteVerification", "Google Site Verification", /^[A-Za-z0-9_-]{20,100}$/, "the content value only, not the whole meta tag"],
  ["metaTestEventCode", "Meta test event code", /^[A-Za-z0-9_-]{3,30}$/, "TEST12345"],
];

export const getSettings = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponsive(200, present(await getTrackingSettings()), "Tracking settings fetched"));
});

export const saveSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const current = await getTrackingSettings();
  const data = { updatedBy: req.admin?.id || null };

  for (const [field, label, pattern, example] of RULES) {
    if (body[field] === undefined) continue;
    let value = String(body[field] ?? "").trim();
    // people paste the whole meta tag: pull the content value out of it
    if (field === "googleSiteVerification") {
      const m = value.match(/content=["']([^"']+)["']/i);
      if (m) value = m[1];
    }
    if (field === "googleAnalyticsId" || field === "googleTagManagerId") value = value.toUpperCase();
    if (value && !pattern.test(value)) throw new ApiError(400, `${label} looks wrong. Expected something like ${example}.`);
    data[field] = value || null;
  }

  if (body.metaCapiToken !== undefined) {
    const token = String(body.metaCapiToken || "").trim();
    if (token && token.length < 20) throw new ApiError(400, "The Meta Conversions API access token looks too short.");
    if (token) data.metaCapiToken = encrypt(token);
  }
  if (body.clearMetaCapiToken === true) data.metaCapiToken = null;

  // Conversions API needs the pixel it belongs to
  const nextPixel = data.metaPixelId !== undefined ? data.metaPixelId : current.metaPixelId;
  const nextToken = data.metaCapiToken !== undefined ? data.metaCapiToken : current.metaCapiToken;
  if (nextToken && !nextPixel) throw new ApiError(400, "Add the Meta Pixel ID before saving a Conversions API token.");

  const saved = await prisma.trackingSettings.update({ where: { id: current.id }, data });
  res.status(200).json(new ApiResponsive(200, present(saved), "Tracking settings saved. The website picks them up within a minute."));
});

// Public: the storefront reads this to load the tags
export const getPublicConfig = asyncHandler(async (req, res) => {
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponsive(200, await getPublicTrackingConfig(), "Tracking config"));
});
