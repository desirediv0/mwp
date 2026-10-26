"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ClientOnly } from "@/components/client-only";
import { IconChevronLeft, IconLoader2 } from "@tabler/icons-react";
import "./settings.css";

const TITLES = {
  "/account/orders": "Orders",
  "/account/addresses": "Addresses",
  "/account/returns": "Returns",
  "/account/subscriptions": "Subscriptions",
  "/account/change-password": "Password",
};

export default function AccountLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth?redirect=/account");
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF8F2]">
        <IconLoader2 className="h-6 w-6 animate-spin text-[#A8741F]" stroke={1.5} />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const isHome = pathname === "/account";
  const isOrderDetail = pathname.startsWith("/account/orders/");
  const title = isOrderDetail ? "Order details" : TITLES[pathname];
  const back = isOrderDetail ? "/account/orders" : "/account";

  return (
    <ClientOnly>
      <div className="mwp-account mwp-page mwp-set-page">
        <div className={isOrderDetail ? "mwp-set mwp-set-wide" : "mwp-set"}>
          {!isHome && (
            <header className="mwp-set-top">
              <Link href={back} className="mwp-set-back" aria-label="Back">
                <IconChevronLeft size={20} stroke={1.8} />
              </Link>
              <h1 className="mwp-set-title">{title}</h1>
            </header>
          )}
          {children}
        </div>
      </div>
    </ClientOnly>
  );
}
