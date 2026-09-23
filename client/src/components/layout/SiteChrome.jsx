"use client";

import { Navbar } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CompareTray } from "@/components/products/CompareTray";
import { AuthModal } from "@/components/ui/AuthModal";
import MwpAdvisor from "@/components/ui/MwpAdvisor";

// The maintenance page is a standalone full-screen experience — no site
// header/footer/chrome should wrap it while maintenance mode is active.
// `isMaintenance` is computed server-side (from the middleware-set
// x-maintenance-active header) because middleware serves it via a rewrite,
// so the browser URL stays "/" and usePathname() can't detect it client-side.
export function SiteChrome({ children, isMaintenance }) {
  if (isMaintenance) {
    return children;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CompareTray />
      <MwpAdvisor />
      <AuthModal />
    </>
  );
}
