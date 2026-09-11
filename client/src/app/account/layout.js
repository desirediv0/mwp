"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ClientOnly } from "@/components/client-only";
import {
  IconUser,
  IconPackage,
  IconRefresh,
  IconMapPin,
  IconHeart,
  IconLoader2,
  IconChevronRight,
} from "@tabler/icons-react";

const iconMap = {
  User: IconUser,
  Package: IconPackage,
  RotateCcw: IconRefresh,
  MapPin: IconMapPin,
  Heart: IconHeart,
};

export default function AccountLayout({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth?redirect=/account");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <IconLoader2 className="h-6 w-6 animate-spin text-gold" stroke={1.5} />
      </div>
    );
  }

  const navItems = [
    { path: "/account", label: "Profile", icon: "User" },
    { path: "/account/orders", label: "Orders", icon: "Package" },
    { path: "/account/returns", label: "Returns", icon: "RotateCcw" },
    { path: "/account/addresses", label: "Addresses", icon: "MapPin" },
    { path: "/wishlist", label: "Wishlist", icon: "Heart" },
  ];

  const isActive = (path) => pathname === path;
  const specialPages = ["/account/orders/", "/account/change-password", "/account/returns/"];
  const isSpecialPage = specialPages.some((path) => pathname.startsWith(path) && pathname !== "/account/orders");

  return (
    <ClientOnly>
      <div className="min-h-screen bg-ivory">

        {/* Page Header */}
        <div className="bg-white border-b border-line">
          <div className="max-w-7xl mx-auto px-5 py-10 md:py-14">
            <span className="luxe-eyebrow block mb-3">My Account</span>
            <h1 className="font-display text-3xl md:text-4xl text-noir tracking-tight">
              {user?.name || "Welcome"}
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 py-8 md:py-12">
          {isSpecialPage ? children : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-line p-6 lg:sticky lg:top-8">
                  {/* User info */}
                  <div className="pb-6 mb-6 border-b border-line">
                    <div className="w-14 h-14 bg-noir text-ivory flex items-center justify-center font-display text-xl mb-4">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <p className="font-display text-[15px] text-noir tracking-tight">{user?.name}</p>
                    <p className="text-[12px] text-stone font-light mt-0.5">{user?.email}</p>
                  </div>

                  {/* Navigation */}
                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = iconMap[item.icon];
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`flex items-center justify-between px-4 py-3 text-[13px] transition-all duration-300 ${
                            active
                              ? "bg-noir text-ivory font-medium"
                              : "text-stone hover:text-noir hover:bg-ivory"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className="h-4 w-4" stroke={1.5} />
                            {item.label}
                          </span>
                          <IconChevronRight className="h-3.5 w-3.5 opacity-40" stroke={1.5} />
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
