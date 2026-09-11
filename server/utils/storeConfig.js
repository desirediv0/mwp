/**
 * Store Configuration Utility
 * Centralized configuration for store name, email, and other store-specific settings
 * All values can be overridden via environment variables
 */

export const getStoreConfig = () => {
  return {
    // Store Information
    storeName: process.env.STORE_NAME || "MWP SUPPLEMENTS",
    storeEmail: process.env.STORE_EMAIL || "support@mwpsupplements.com",
    storePhone: process.env.STORE_PHONE || "+91 76783 36268",
    storeAddress: process.env.STORE_ADDRESS || "India",

    // Store Description/Tagline
    storeTagline: process.env.STORE_TAGLINE || "MEN | WOMEN | POWER",
    storeDescription:
      process.env.STORE_DESCRIPTION ||
      "Elite performance nutrition and wellness formulations engineered for peak physical and mental drive.",

    // Email Configuration
    fromName: process.env.FROM_NAME || process.env.STORE_NAME || "MWP SUPPLEMENTS",
    fromEmail:
      process.env.FROM_EMAIL ||
      process.env.STORE_EMAIL ||
      process.env.SMTP_USER ||
      "support@mwpsupplements.com",

    // Website Information
    websiteUrl: process.env.WEBSITE_URL || "https://mwpsupplements.com",
    supportEmail:
      process.env.SUPPORT_EMAIL ||
      process.env.STORE_EMAIL ||
      "support@mwpsupplements.com",

    // Social Media (optional)
    socialFacebook: process.env.SOCIAL_FACEBOOK || "https://www.facebook.com/mwpsupplements",
    socialTwitter: process.env.SOCIAL_TWITTER || "",
    socialInstagram: process.env.SOCIAL_INSTAGRAM || "https://www.instagram.com/mwpsupplements",
    socialYoutube: process.env.SOCIAL_YOUTUBE || "",
    socialWhatsapp: process.env.SOCIAL_WHATSAPP || "917678336268",
  };
};

/**
 * Get store name
 */
export const getStoreName = () => {
  return getStoreConfig().storeName;
};

/**
 * Get store email
 */
export const getStoreEmail = () => {
  return getStoreConfig().storeEmail;
};

/**
 * Get from name for emails
 */
export const getFromName = () => {
  return getStoreConfig().fromName;
};

/**
 * Get from email for emails
 */
export const getFromEmail = () => {
  return getStoreConfig().fromEmail;
};

/**
 * Get full store information object
 */
export const getFullStoreInfo = () => {
  const config = getStoreConfig();
  return {
    name: config.storeName,
    email: config.storeEmail,
    phone: config.storePhone,
    address: config.storeAddress,
    tagline: config.storeTagline,
    description: config.storeDescription,
    websiteUrl: config.websiteUrl,
    supportEmail: config.supportEmail,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    social: {
      facebook: config.socialFacebook,
      twitter: config.socialTwitter,
      instagram: config.socialInstagram,
      youtube: config.socialYoutube,
    },
  };
};

export default getStoreConfig;
