import "./globals.css";
import { Inter, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { LanguageProvider } from "@/lib/language-context";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: {
    default: "MWP SUPPLEMENTS — Men | Women | Power | Premium Wellness",
    template: "%s | MWP SUPPLEMENTS",
  },
  description:
    "MWP SUPPLEMENTS (Men | Women | Power) — premium global wellness formulas: Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy and Daily Vitality. Lab tested, GMP certified.",
  keywords:
    "MWP SUPPLEMENTS, Men Women Power, Testosterone Booster, Male Vitality, Tongkat Ali, Shilajit, Nitric Oxide, Women's Wellness, Hormone Balance, Daily Wellness, Immune Support",
  authors: [{ name: "MWP SUPPLEMENTS" }],
  openGraph: {
    title: "MWP SUPPLEMENTS — Men | Women | Power",
    description:
      "Premium global wellness brand. Clinical-grade formulas for vitality, performance and daily health.",
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans bg-[#09090b] text-white">
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
