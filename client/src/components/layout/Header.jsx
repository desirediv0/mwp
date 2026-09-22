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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  IconSearch,
  IconUser,
  IconShoppingBag,
  IconHeart,
  IconMenu2,
  IconX,
  IconPhone,
  IconBrandInstagram,
  IconBrandFacebook,
  IconArrowUpRight,
  IconHome,
  IconBuildingStore,
  IconCategory,
  IconInfoCircle,
  IconChevronDown,
  IconChevronRight,
  IconShieldCheck,
  IconTruck,
  IconGitCompare,
} from "@tabler/icons-react";
import { useCompare } from "@/lib/compare-context";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/products", label: "Shop All", icon: IconBuildingStore },
  { href: "/why-us", label: "Why MWP", icon: IconInfoCircle },
  { href: "/contact", label: "Contact", icon: IconPhone },
];

const ANNOUNCEMENTS = [
  "FREE PAN-INDIA EXPRESS SHIPPING ON ORDERS ABOVE ₹999 | 100% CLINICAL POTENCY FORMULAS",
];

const getImg = (p) => {
  const raw = p.image || p.images?.[0]?.url;
  if (!raw) return "/placeholder.jpg";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

function AvatarCircle({ name, size = "sm" }) {
  const dim = size === "lg" ? "w-11 h-11 text-sm" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 bg-neutral-700 ring-1 ring-white/20`}
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const catCloseTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
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
    fetchApi("/public/categories")
      .then((res) => setCategories(sortCategories(res.data?.categories || [])))
      .catch(console.error);
  }, []);

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
            ? "bg-[#0A0A0A]/95 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] border-b border-white/10"
            : "bg-[#0A0A0A] border-b border-white/[0.06]"
        )}
      >
        {/* Announcement bar — collapses smoothly on scroll, Track Order removed */}
        <div
          className={cn(
            "overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-white/[0.04] transition-all duration-300",
            scrolled ? "max-h-0 opacity-0" : "max-h-8 opacity-100"
          )}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between h-8 text-[11px] font-semibold text-white/90">
            {/* Desktop Left: Social + Lab Tested */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://www.instagram.com/mwpsupplements"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <IconBrandInstagram className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.facebook.com/mwpsupplements"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <IconBrandFacebook className="h-3.5 w-3.5" />
              </a>
              <span className="text-white/20">|</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <IconShieldCheck className="h-3.5 w-3.5" /> 100% Lab Tested
              </span>
            </div>

            {/* Announcement Center (visible on all screens) */}
            <div className="flex-1 text-center truncate tracking-wider uppercase text-[10px] sm:text-[11px] text-white/90 px-2 font-medium">
              {ANNOUNCEMENTS[0]}
            </div>

            {/* Desktop Right: Shipping info (Track Order removed) */}
            <div className="hidden md:flex items-center gap-3 text-[11px] uppercase tracking-wider">
              <span className="inline-flex items-center gap-1 text-[10px] text-white/70">
                <IconTruck className="h-3.5 w-3.5" /> Free Express Shipping ₹999+
              </span>
            </div>
          </div>
        </div>

        {/* Main Header Bar — Logo on left, Menu in center, Actions on right (NEVER hides on scroll) */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div
            className={cn(
              "flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300",
              scrolled ? "h-14 sm:h-16" : "h-16 sm:h-[72px]"
            )}
          >
            {/* 1. Left — Brand Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/logo.png"
                alt="MWP SUPPLEMENTS"
                width={160}
                height={60}
                className={cn(
                  "w-auto object-contain transition-all duration-300",
                  scrolled ? "h-7 sm:h-9" : "h-8 sm:h-10 md:h-11"
                )}
                priority
              />
            </Link>

            {/* 2. Center — Navigation Menu (Desktop & Laptop) */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* All Categories Trigger + Mega Dropdown */}
              {categories.length > 0 && (
                <div className="relative" onMouseEnter={openCat} onMouseLeave={closeCatSoon}>
                  <button
                    onClick={() => setIsCatOpen((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-[12px] xl:text-[12.5px] font-bold uppercase tracking-wider transition-all rounded-md",
                      isCatOpen
                        ? "bg-white/10 text-white"
                        : "text-neutral-200 hover:text-white hover:bg-white/[0.06]"
                    )}
                    aria-haspopup="true"
                    aria-expanded={isCatOpen}
                  >
                    <IconCategory className="h-4 w-4 text-white/80" stroke={2} />
                    All Categories
                    <IconChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isCatOpen && "rotate-180"
                      )}
                      stroke={2.5}
                    />
                  </button>

                  <AnimatePresence>
                    {isCatOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute left-0 top-full mt-2 w-[540px] max-w-[85vw] bg-[#101012] border border-white/10 rounded-lg shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] overflow-hidden z-[70]"
                      >
                        <div className="px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
                          <span className="text-[10px] uppercase tracking-[0.28em] text-white font-bold">
                            Shop by Category
                          </span>
                          <Link
                            href="/categories"
                            onClick={() => setIsCatOpen(false)}
                            className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            View all <IconArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto p-2.5 grid grid-cols-2 gap-1.5">
                          {categories.map((c) => {
                            const href = `/category/${c.slug}`;
                            const active = pathname === href;
                            return (
                              <Link
                                key={c.id}
                                href={href}
                                onClick={() => setIsCatOpen(false)}
                                className={cn(
                                  "group/cat flex items-center justify-between gap-2 px-3 py-2.5 text-[12px] font-semibold transition-all rounded",
                                  active
                                    ? "bg-white/15 text-white font-bold"
                                    : "text-neutral-300 hover:bg-white/[0.06] hover:text-white"
                                )}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                                      active ? "bg-white" : "bg-white/30 group-hover/cat:bg-white"
                                    )}
                                  />
                                  <span className="truncate">{c.name}</span>
                                </span>
                                {c._count?.products ? (
                                  <span className="shrink-0 text-[10px] text-neutral-400 font-medium bg-white/[0.05] px-1.5 py-0.5 rounded">
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

              <span className="w-px h-4 bg-white/10 mx-1" />

              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-3 py-2 text-[12px] xl:text-[12.5px] font-bold uppercase tracking-wider transition-all rounded-md whitespace-nowrap",
                      active
                        ? "text-white bg-white/10"
                        : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                    )}
                  >
                    {label}
                    {active && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* 3. Right — Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Search button — opens interactive live search dialog */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all rounded-md"
                aria-label="Search"
                title="Search products"
              >
                <IconSearch className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
              </button>

              <ClientOnly>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 hover:bg-white/10 transition-colors rounded-md"
                    aria-label="Account"
                  >
                    <AvatarCircle name={user?.name} size="sm" />
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors rounded-md"
                    aria-label="Login"
                  >
                    <IconUser className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                  </Link>
                )}
              </ClientOnly>

              <Link
                href="/compare"
                className="hidden sm:flex relative items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors rounded-md"
                aria-label="Compare"
              >
                <IconGitCompare className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-700 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-[#0A0A0A] rounded-full">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                href="/wishlist"
                className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-neutral-300 hover:text-white hover:bg-white/10 transition-colors rounded-md"
                aria-label="Wishlist"
              >
                <IconHeart className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
              </Link>

              <ClientOnly>
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.06] border border-white/10 text-white hover:bg-white hover:text-black hover:border-white active:scale-95 transition-all rounded-md"
                  aria-label="Cart"
                >
                  <IconShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full shadow">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </ClientOnly>

              {/* Mobile Menu Button with clear tap target */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.06] border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all rounded-md ml-0.5"
                aria-label="Toggle Menu"
              >
                <IconMenu2 className="h-5 w-5" stroke={2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Live Search Modal */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        categories={categories}
      />

      {/* Modern High-End Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        categories={categories}
        cartCount={cartCount}
        compareCount={compareCount}
        handleLogout={handleLogout}
        pathname={pathname}
        onOpenSearch={() => {
          setIsMenuOpen(false);
          setIsSearchOpen(true);
        }}
      />
    </>
  );
}

function SearchDialog({ open, onOpenChange, categories }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);
  const debRef = useRef(null);

  const POPULAR_SEARCHES = [
    "Ultra Pro",
    "Power Max",
    "Rapid Boost",
    "Her Power",
    "Shilajit",
    "Testosterone",
    "Pre Workout",
  ];

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const term = searchQuery.trim();
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
    }, 200);
    return () => debRef.current && clearTimeout(debRef.current);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const term = searchQuery.trim();
    if (!term) return;
    onOpenChange(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  const handleSelectProduct = (slug) => {
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  const handleTagClick = (term) => {
    setSearchQuery(term);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-[600px] max-h-[85vh] bg-[#0E0E11] text-white p-0 overflow-hidden border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.9)] rounded-xl">
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="relative border-b border-white/10 p-3.5 sm:p-5">
          <div className="relative flex items-center">
            <IconSearch className="absolute left-3.5 h-4.5 w-4.5 sm:h-5 sm:w-5 text-neutral-400" stroke={2.2} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, ingredients, protocols…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-20 sm:pr-24 bg-white/[0.06] border border-white/15 rounded-lg text-[13px] sm:text-[14px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/40 focus:bg-white/[0.09] transition-all"
            />
            <div className="absolute right-2 flex items-center gap-1 sm:gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                  aria-label="Clear search"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-2.5 sm:px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Content area: Live Results or Suggestions */}
        <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto p-3.5 sm:p-5">
          {searchQuery.trim().length >= 2 ? (
            <div>
              <div className="flex items-center justify-between mb-3 text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
                <span>Search Results</span>
                {loading && <span className="text-white animate-pulse">Searching…</span>}
              </div>

              {loading ? (
                <div className="py-8 text-center text-sm text-neutral-400">Loading products…</div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-300 font-medium">
                    No products found for &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Try searching for Shilajit, Ultra Pro, or browse all products.
                  </p>
                  <Link
                    href="/products"
                    onClick={() => onOpenChange(false)}
                    className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
                  >
                    View All Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {results.map((p) => {
                    const cat = p.category?.name || p.categories?.[0]?.category?.name;
                    return (
                      <button
                        key={p.id || p.slug}
                        type="button"
                        onClick={() => handleSelectProduct(p.slug)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left group"
                      >
                        <span className="relative w-11 h-11 sm:w-12 sm:h-12 overflow-hidden bg-white/[0.04] rounded border border-white/10 shrink-0">
                          <Image
                            src={getImg(p)}
                            alt={p.name || "Product"}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-white truncate">
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {cat && (
                              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-400 font-medium truncate">
                                {cat}
                              </span>
                            )}
                            {p.price && (
                              <span className="text-xs font-bold text-emerald-400 shrink-0">
                                ₹{Number(p.price).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                        <IconArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full mt-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-white/10 rounded border border-white/10 transition-colors"
                  >
                    View all results for &ldquo;{searchQuery.trim()}&rdquo; &rarr;
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {/* Popular Searches */}
              <div>
                <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleTagClick(term)}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/[0.05] hover:bg-white/15 hover:text-white border border-white/10 text-[11px] sm:text-xs font-medium text-neutral-300 rounded-full transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-2">
                    Browse Categories
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {categories.slice(0, 8).map((c) => (
                      <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/[0.03] hover:bg-white/10 border border-white/10 text-[11px] sm:text-xs font-medium text-neutral-300 rounded transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MobileMenu({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  categories,
  cartCount,
  compareCount = 0,
  handleLogout,
  pathname,
  onOpenSearch,
}) {
  const [catsExpanded, setCatsExpanded] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer Body */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[340px] bg-[#0C0C0E] border-r border-white/10 shadow-2xl flex flex-col text-white z-50 overflow-hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 1. Header with Logo & Close button */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/40">
              <Image
                src="/logo.png"
                alt="MWP SUPPLEMENTS"
                width={130}
                height={50}
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all rounded-md"
                aria-label="Close menu"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {/* 2. Quick Search & Quick Actions Bar */}
            <div className="p-3 border-b border-white/[0.08] bg-white/[0.02]">
              <button
                onClick={onOpenSearch}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <IconSearch className="h-4 w-4 text-neutral-400" />
                <span>Search supplements, ingredients…</span>
              </button>

              {/* Quick links: Compare & Wishlist on mobile */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/[0.03] border border-white/[0.08] rounded text-[11px] font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  <IconHeart className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/compare"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/[0.03] border border-white/[0.08] rounded text-[11px] font-semibold text-neutral-300 hover:text-white transition-colors relative"
                >
                  <IconGitCompare className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Compare</span>
                  {compareCount > 0 && (
                    <span className="ml-1 bg-neutral-700 text-white text-[9px] font-bold px-1 rounded-full">
                      {compareCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* 3. User Authentication Box */}
            <div className="p-3.5 border-b border-white/[0.08] bg-white/[0.015]">
              <ClientOnly>
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarCircle name={user?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">
                          {user?.name || "Athlete"}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href="/account"
                        onClick={onClose}
                        className="px-2 py-1 bg-white/10 hover:bg-white/15 text-[11px] font-bold rounded uppercase transition-colors"
                      >
                        Account
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth"
                      onClick={onClose}
                      className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[11px] uppercase tracking-wider text-center rounded transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth?tab=register"
                      onClick={onClose}
                      className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-[11px] uppercase tracking-wider text-center rounded transition-all"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </ClientOnly>
            </div>

            {/* 4. Scrollable Navigation & Categories */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {/* Main Nav Links */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500 px-2 mb-1.5">
                  Menu
                </p>
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between py-2 px-3 text-xs font-bold uppercase tracking-wider transition-colors rounded-md",
                        active
                          ? "text-white bg-white/10 font-extrabold"
                          : "text-neutral-300 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && <Icon className="h-4 w-4 text-white/80" stroke={2} />}
                        <span>{label}</span>
                      </div>
                      <IconChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  );
                })}
              </div>

              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="pt-2 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500">
                      All Categories
                    </span>
                    <Link
                      href="/categories"
                      onClick={onClose}
                      className="text-[10px] uppercase font-bold text-neutral-400 hover:text-white inline-flex items-center gap-0.5"
                    >
                      View All <IconArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-0.5">
                    {categories.map((c) => {
                      const href = `/category/${c.slug}`;
                      const active = pathname === href;
                      return (
                        <Link
                          key={c.id}
                          href={href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between py-2 px-3 text-xs rounded-md transition-colors",
                            active
                              ? "bg-white/15 text-white font-bold"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <span className="truncate">{c.name}</span>
                          {c._count?.products ? (
                            <span className="text-[10px] font-semibold text-neutral-500 bg-white/[0.05] px-1.5 py-0.5 rounded">
                              {c._count.products}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Mobile Drawer Footer */}
            <div className="p-3.5 border-t border-white/10 bg-[#060608] space-y-2">
              <div className="flex items-center justify-center gap-4 text-neutral-400">
                <a
                  href="https://www.instagram.com/mwpsupplements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <IconBrandInstagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/mwpsupplements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <IconBrandFacebook className="h-4 w-4" />
                </a>
                <span className="text-white/20">|</span>
                <span className="text-[10px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <IconShieldCheck className="h-3.5 w-3.5" /> 100% Lab Tested
                </span>
              </div>
              <p className="text-[9px] text-neutral-500 tracking-wider uppercase font-semibold text-center">
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
