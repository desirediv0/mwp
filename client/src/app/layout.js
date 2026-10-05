import "./globals.css";
import "./mwp-pages.css";
import { headers } from "next/headers";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { LanguageProvider } from "@/lib/language-context";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Toaster } from "sonner";

export const metadata = {
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

export default function RootLayout({ children }) {
  const isMaintenance = headers().get("x-maintenance-active") === "1";

  return (
    <html lang="en">
      <body className="antialiased font-sans bg-white text-neutral-900">
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <LanguageProvider>
                <Toaster
                  position="top-center"
                  style={{ zIndex: 999999 }}
                  toastOptions={{
                    style: {
                      background: "#121216",
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
