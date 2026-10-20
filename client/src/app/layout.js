import "./globals.css";
import "./mwp-pages.css";
import { headers } from "next/headers";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { LanguageProvider } from "@/lib/language-context";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Toaster } from "sonner";
import Tracking, { TrackingNoscript } from "@/components/analytics/Tracking";
import { SITE_URL, ORGANIZATION_JSON_LD, jsonLd } from "@/lib/seo";
import { getTrackingConfig } from "@/lib/tracking-config";

const baseMetadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  applicationName: "MWP SUPPLEMENTS",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  title: {
    default: "MWP SUPPLEMENTS — Men | Women | Power | Premium Wellness",
    template: "%s | MWP SUPPLEMENTS",
  },
  description:
    "MWP SUPPLEMENTS (Men | Women | Power) offers eight formulas for everyday wellness, energy and performance. Explore ingredients and find the routine that fits you.",
  keywords:
    "MWP SUPPLEMENTS, Men Women Power, Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy, Daily Vitality, Alpha Prime, Titan Force, supplements, daily wellness",
  authors: [{ name: "MWP SUPPLEMENTS" }],
  openGraph: {
    title: "MWP SUPPLEMENTS — Men | Women | Power",
    description:
      "Eight formulas for everyday wellness, energy and performance.",
    type: "website",
    locale: "en_US",
    siteName: "MWP SUPPLEMENTS",
  },
  twitter: {
    card: "summary_large_image",
    title: "MWP SUPPLEMENTS — Men | Women | Power",
    description:
      "Premium wellness formulas for Men and Women. Fuel strength, stamina and daily vitality.",
  },
};

// The Google verification tag comes from Admin > Tracking
export async function generateMetadata() {
  const { googleSiteVerification } = await getTrackingConfig();
  return { ...baseMetadata, ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}) };
}

export default async function RootLayout({ children }) {
  const tracking = await getTrackingConfig();
  const isMaintenance = headers().get("x-maintenance-active") === "1";

  return (
    <html lang="en">
      <body className="antialiased font-sans bg-white text-neutral-900">
        <TrackingNoscript gtmId={tracking.googleTagManagerId} pixelId={tracking.metaPixelId} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ORGANIZATION_JSON_LD) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MWP SUPPLEMENTS",
              url: SITE_URL,
              potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/products?search={search_term_string}`, "query-input": "required name=search_term_string" },
            }),
          }}
        />
        <Tracking gaId={tracking.googleAnalyticsId} gtmId={tracking.googleTagManagerId} pixelId={tracking.metaPixelId} />
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <LanguageProvider>
                <Toaster
                  position="top-center"
                  style={{ zIndex: 999999 }}
                  toastOptions={{
                    style: {
                      background: "#12213F",
                      color: "#FFFFFF",
                      border: "1px solid rgba(201, 162, 39, 0.45)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      letterSpacing: "0.01em",
                      zIndex: 999999,
                    },
                  }}
                />
                <SiteChrome isMaintenance={isMaintenance}>{children}</SiteChrome>
              </LanguageProvider>
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
