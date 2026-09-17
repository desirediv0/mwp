"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchApi, cn, sortCategories } from "@/lib/utils";
import { ClientOnly } from "@/components/client-only";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  IconSearch,
  IconUser,
  IconShoppingBag,
  IconHeart,
  IconMenu2,
  IconX,
  IconPackage,
  IconPhone,
  IconBrandInstagram,
  IconBrandFacebook,
  IconArrowUpRight,
  IconHome,
  IconBuildingStore,
  IconCategory,
  IconCompass,
  IconFlask,
  IconInfoCircle,
  IconMoodSmile,
  IconChevronDown,
  IconShieldCheck,
  IconTruck,
  IconGitCompare,
} from "@tabler/icons-react";
import { useCompare } from "@/lib/compare-context";

// Static links only. Category links are rendered dynamically from the API
// (see `categories` state) so the nav never shows a category that doesn't exist.
const NAV_LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/products", label: "Shop All", icon: IconBuildingStore },
  { href: "/why-us", label: "Why MWP", icon: IconInfoCircle },
  { href: "/contact", label: "Contact", icon: IconPhone },
];

const ANNOUNCEMENTS = [
  "FREE PAN-INDIA EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | 100% CLINICAL POTENCY FORMULAS",
];

/* ---------------- Inline live search (desktop header) ---------------- */
function InlineSearch({ className = "" }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const debRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debRef.current = setTimeout(async () => {
      try {
        const res = await fetchApi(
          `/public/products?search=${encodeURIComponent(term)}&limit=6`
        );
        setResults(res?.data?.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => debRef.current && clearTimeout(debRef.current);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  const getImg = (p) => {
    const raw = p.image || p.images?.[0]?.url;
    if (!raw) return "/placeholder.jpg";
    if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form onSubmit={submit} className="group/search relative flex items-center">
        <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within/search:text-white transition-colors" stroke={2.2} />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search supplements, ingredients, protocols…"
          className="w-full h-11 pl-11 pr-28  bg-white/[0.07] border border-white/12 text-[13.5px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:bg-white/[0.1] focus:ring-4 focus:ring-white/10 transition-all"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4  bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold uppercase tracking-wider transition-colors"
        >
          Search
        </button>
      </form>

      {open && q.trim().length >= 2 && (
          <div
            className="absolute left-0 right-0 top-full mt-2 bg-[#111114] border border-white/12 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.75)] overflow-hidden z-[70] animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {loading ? (
              <div className="px-4 py-6 text-center text-[12px] text-neutral-400">Searching…</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-neutral-400">
                No results for &ldquo;{q.trim()}&rdquo;
              </div>
            ) : (
              <>
                <div className="max-h-[380px] overflow-y-auto p-2">
                  {results.map((p, i) => {
                    const cat = p.category?.name || p.categories?.[0]?.category?.name;
                    return (
                      <Link
                        key={p.id || p.slug || i}
                        href={`/products/${p.slug}`}
                        onClick={() => { setOpen(false); setQ(""); }}
                        className="flex items-center gap-3 px-2.5 py-2.5 hover:bg-white/[0.06] transition-colors"
                      >
                        <span className="relative w-10 h-10 overflow-hidden bg-white/[0.06] shrink-0 border border-white/10">
                          <Image src={getImg(p)} alt={p.name || "Product"} fill className="object-cover" sizes="40px" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold text-white truncate">
                            {p.name || "Untitled product"}
                          </div>
                          {cat && (
                            <div className="text-[10px] uppercase tracking-wider text-neutral-400 truncate mt-0.5">
                              {cat}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={submit}
                  className="w-full py-3 text-[11px] uppercase tracking-[0.15em] font-bold text-neutral-300 hover:text-white hover:bg-white/20 border-t border-white/10 transition-colors"
                >
                  View all results for &ldquo;{q.trim()}&rdquo;
                </button>
              </>
            )}
          </div>
        )}
    </div>
  );
}

function AvatarCircle({ name, size = "sm" }) {
  const dim = size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${dim}  flex items-center justify-center text-white font-bold flex-shrink-0 bg-neutral-700`}
    >
      {name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count: compareCount } = useCompare();
  const { getCartItemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchInputRef = useRef(null);
  const catCloseTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openCat = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
    setIsCatOpen(true);
  };
  const closeCatSoon = () => {
    catCloseTimer.current = setTimeout(() => setIsCatOpen(false), 150);
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsCatOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [isSearchOpen]);

  useEffect(() => {
    fetchApi("/public/categories")
      .then((res) => setCategories(sortCategories(res.data?.categories || [])))
      .catch(console.error);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    router.push("/");
  };

  const cartCount = getCartItemCount();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 left-0 right-0 z-50 w-full text-white transition-all duration-300",
          scrolled
            ? "bg-[#0A0A0A]/95 backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-b border-white/10"
            : "bg-[#0A0A0A] border-b border-white/[0.06]"
        )}
      >
        {/* Announcement bar — collapses on scroll */}
        <div
          className={cn(
            "overflow-hidden bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 transition-all duration-300",
            scrolled ? "max-h-0" : "max-h-10"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8 text-[11px] font-semibold text-white/90">
            <div className="hidden md:flex items-center gap-3">
              <a href="https://www.instagram.com/mwpsupplements" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Instagram">
                <IconBrandInstagram className="h-3.5 w-3.5" />
              </a>
              <a href="https://www.facebook.com/mwpsupplements" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" aria-label="Facebook">
                <IconBrandFacebook className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex-1 text-center truncate tracking-wider uppercase text-[10px] sm:text-[11px]">
              {ANNOUNCEMENTS[0]}
            </div>
            <div className="hidden md:flex items-center gap-4 text-[11px] uppercase tracking-wider">
              <Link href="/account" className="inline-flex items-center gap-1.5 hover:text-white/70 transition-colors">
                <IconPackage className="h-3.5 w-3.5" /> Track Order
              </Link>
            </div>
          </div>
        </div>

        {/* Row 1 — logo · search · actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn("flex items-center gap-4 lg:gap-8 transition-all duration-300", scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20")}>

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/logo.png"
                alt="MWP SUPPLEMENTS"
                width={190}
                height={75}
                className={cn("w-auto object-contain transition-all duration-300", scrolled ? "h-9 sm:h-10" : "h-9 sm:h-11 md:h-12")}
                priority
              />
            </Link>

            {/* Inline live search — visible md+ */}
            <div className="hidden md:block flex-1 max-w-2xl">
              <InlineSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <IconSearch className="h-5 w-5" stroke={2} />
              </button>

              <ClientOnly>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center justify-center w-10 h-10 hover:bg-white/10 transition-colors"
                    aria-label="Account"
                  >
                    <AvatarCircle name={user?.name} size="sm" />
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="hidden sm:flex items-center justify-center w-10 h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Login"
                  >
                    <IconUser className="h-5 w-5" stroke={2} />
                  </Link>
                )}
              </ClientOnly>

              <Link
                href="/compare"
                className="hidden sm:flex relative items-center justify-center w-10 h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Compare"
              >
                <IconGitCompare className="h-5 w-5" stroke={2} />
                {compareCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-neutral-700 text-white text-[10px] font-black  min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-[#0A0A0A]">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                href="/wishlist"
                className="hidden sm:flex items-center justify-center w-10 h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Wishlist"
              >
                <IconHeart className="h-5 w-5" stroke={2} />
              </Link>

              <ClientOnly>
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center w-10 h-10 bg-white/[0.06] border border-white/10 text-white hover:bg-white hover:border-white/20 transition-all"
                  aria-label="Cart"
                >
                  <IconShoppingBag className="h-5 w-5" stroke={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-neutral-700 text-white text-[10px] font-black  min-w-[19px] h-[19px] flex items-center justify-center px-1 ring-2 ring-[#0A0A0A]">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </ClientOnly>

              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 bg-white/[0.06] border border-white/10 text-white hover:text-neutral-300 hover:bg-white/10 transition-all"
                aria-label="Toggle Menu"
              >
                <IconMenu2 className="h-5 w-5" stroke={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 — nav strip (lg+), hides on scroll */}
        <div
          className={cn(
            "hidden lg:block overflow-visible border-t border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent transition-all duration-300",
            scrolled ? "max-h-0 border-t-0 pointer-events-none opacity-0" : "max-h-16 opacity-100"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 h-12">
              {/* All Categories — trigger + mega dropdown */}
              {categories.length > 0 && (
                <div className="relative" onMouseEnter={openCat} onMouseLeave={closeCatSoon}>
                  <button
                    onClick={() => setIsCatOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-2 pl-3 pr-3.5 py-2 text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                      isCatOpen
                        ? "bg-neutral-800 text-white shadow-lg shadow-black/30"
                        : "bg-white/[0.06] text-neutral-100 hover:bg-white/10"
                    )}
                    aria-haspopup="true"
                    aria-expanded={isCatOpen}
                  >
                    <IconCategory className="h-4 w-4" stroke={2.2} />
                    All Categories
                    <IconChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", isCatOpen && "rotate-180")}
                      stroke={2.5}
                    />
                  </button>

                  <AnimatePresence>
                    {isCatOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full mt-2 w-[600px] max-w-[84vw] bg-[#101012] border border-white/10 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden"
                      >
                        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06]">
                          <span className="text-[10px] uppercase tracking-[0.28em] text-white font-bold">
                            Shop by Category
                          </span>
                          <Link
                            href="/categories"
                            className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            View all <IconArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto p-2.5 grid grid-cols-2 gap-1.5">
                          {categories.map((c) => {
                            const href = `/category/${c.slug}`;
                            const active = pathname === href;
                            return (
                              <Link
                                key={c.id}
                                href={href}
                                className={cn(
                                  "group/cat flex items-center justify-between gap-2 px-3.5 py-3 text-[12.5px] font-semibold transition-all",
                                  active
                                    ? "bg-white/15 text-neutral-300"
                                    : "text-neutral-200 hover:bg-white/[0.06] hover:text-white"
                                )}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <span className={cn("w-1.5 h-1.5  shrink-0 transition-colors", active ? "bg-white/80" : "bg-white/20 group-hover/cat:bg-white/80")} />
                                  <span className="truncate">{c.name}</span>
                                </span>
                                {c._count?.products ? (
                                  <span className="shrink-0 text-[10px] text-neutral-500 font-medium bg-white/[0.04] px-1.5 py-0.5">
                                    {c._count.products}
                                  </span>
                                ) : null}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <span className="w-px h-5 bg-white/10 mx-1.5" />

              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3.5 py-2 text-[12px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                      active
                        ? "bg-white/10 text-white"
                        : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}

              <div className="ml-auto flex items-center gap-4 text-[11px] font-semibold text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <IconShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Lab Tested
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconTruck className="h-3.5 w-3.5 text-white" /> Free Shipping ₹999+
                </span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Search Modal Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchInputRef={searchInputRef}
        categories={categories}
      />

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        categories={categories}
        cartCount={cartCount}
        handleLogout={handleLogout}
        pathname={pathname}
      />
    </>
  );
}

function SearchDialog({ open, onOpenChange, searchQuery, setSearchQuery, handleSearch, searchInputRef, categories }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-[#0E0E0E] text-white p-0 overflow-hidden border border-white/10 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-white block mb-1 font-bold">
              MWP SUPPLEMENTS
            </span>
            <span className="text-xl font-extrabold text-white">Search All Formulations</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="px-6 py-4">
          <div className="relative">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by ingredient, formula (e.g. Ultra Pro, Shilajit, Citrulline)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-black/30"
            >
              Search
            </button>
          </div>
        </form>

        {categories.length > 0 && (
          <div className="p-6 bg-white/[0.02] border-t border-white/10">
            <p className="text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-3">
              Popular Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/20 hover:text-neutral-300 border border-white/10 text-xs font-medium text-neutral-300 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MobileMenu({ isOpen, onClose, user, isAuthenticated, categories, cartCount, handleLogout, pathname }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="absolute left-0 top-0 bottom-0 w-full max-w-[320px] sm:max-w-[360px] bg-[#0A0A0A] border-r border-white/10 shadow-2xl flex flex-col text-white z-50"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Mobile Header Top */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <Image
                src="/logo.png"
                alt="MWP SUPPLEMENTS"
                width={150}
                height={60}
                className="h-10 w-auto object-contain"
              />
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {/* Auth CTA / User Row */}
            <div className="p-5 border-b border-white/10 bg-white/[0.02]">
              <ClientOnly>
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={user?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-white truncate">{user?.name || "Athlete"}</p>
                        <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-semibold text-neutral-300 hover:text-neutral-200"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth"
                      onClick={onClose}
                      className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider text-center shadow-md shadow-black/30"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth?tab=register"
                      onClick={onClose}
                      className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-wider text-center"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </ClientOnly>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500 mb-3">
                Navigation
              </p>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-between py-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors",
                      active
                        ? "text-white bg-white/10 font-extrabold"
                        : "text-neutral-300 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-4 w-4 text-white" stroke={2} />}
                      <span>{label}</span>
                    </div>
                    <IconArrowUpRight className="h-3.5 w-3.5 opacity-40" />
                  </Link>
                );
              })}

              {/* Categories */}
              {categories.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500 mb-3">
                    Target Protocols
                  </p>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={onClose}
                      className="block py-2 px-3 text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Bottom Bar */}
            <div className="p-4 border-t border-white/10 bg-[#050505] text-center">
              <p className="text-[10px] text-neutral-500 tracking-wider uppercase font-semibold">
                MEN | WOMEN | POWER &bull; MWP SUPPLEMENTS
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Navbar;
