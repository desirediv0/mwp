import { SITE_URL } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/auth", "/cart", "/checkout", "/compare", "/profile", "/wishlist", "/forgot-password", "/reset-password", "/verify", "/verify-otp", "/resend-verification", "/maintenance", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
