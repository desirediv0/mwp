import "./globals.css";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { CompareTray } from "@/components/products/CompareTray";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";
import { AuthModal } from "@/components/ui/AuthModal";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: {
    default: "MWP SUPPLEMENTS — Men | Women | Power | Elite Performance Nutrition",
    template: "%s | MWP SUPPLEMENTS",
  },
  description:
    "MWP SUPPLEMENTS (Men | Women | Power) delivers clinical-grade performance nutrition: Natural Testosterone Boosters, Pre-Workout Nitric Oxide, Fast-Acting Blood Flow, Women's Hormone & Libido Balance, and Daily Immunity.",
  keywords:
    "MWP SUPPLEMENTS, Men Women Power, Testosterone Booster, Male Vitality, Male Performance, Men's Energy, Men's Stamina, Tongkat Ali, Shilajit, Pre Workout, Nitric Oxide Booster, Muscle Pump, Blood Flow, Women's Libido, Hormone Balance Women, Daily Wellness, Immune Support",
  authors: [{ name: "MWP SUPPLEMENTS" }],
  openGraph: {
    title: "MWP SUPPLEMENTS — Men | Women | Power",
    description:
      "Engineered for peak athletic output and vitality. Clinically dosed formulas with pure active extracts and zero banned substances.",
    type: "website",
    locale: "en_IN",
    siteName: "MWP SUPPLEMENTS",
  },
  twitter: {
    card: "summary_large_image",
    title: "MWP SUPPLEMENTS — Men | Women | Power",
    description:
      "Clinical-grade performance nutrition for Men and Women. Fuel your strength, stamina, and daily vitality.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans bg-[#09090b] text-white">
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
            <Toaster
              position="top-center"
              style={{ zIndex: 999999 }}
              toastOptions={{
                style: {
                  background: "#121216",
                  color: "#FFFFFF",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  letterSpacing: "0.01em",
                  zIndex: 999999,
                },
              }}
            />
            <Navbar />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <CompareTray />
            <FloatingWhatsApp />
            <AuthModal />
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
