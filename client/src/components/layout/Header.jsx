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
import * as DialogPrimitive from "@radix-ui/react-dialog";
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
  IconArrowRight,
  IconChevronDown,
  IconChevronRight,
  IconShieldCheck,
  IconTruck,
  IconGitCompare,
  IconLeaf,
  IconSchool,
  IconWriting,
  IconCertificate,
  IconHome,
} from "@tabler/icons-react";
import { useCompare } from "@/lib/compare-context";
import { useLanguage } from "@/lib/language-context";

const PRODUCT_MENU = [
  { slug: "ultra-pro", href: "/products/ultra-pro", label: "MWP Ultra Pro", tag: "The Quiet Miracle" },
  { slug: "power-max", href: "/products/power-max", label: "MWP Power Max", tag: "Unlock Your Miracle" },
  { slug: "rapid-boost", href: "/products/rapid-boost", label: "MWP Rapid Boost", tag: "Fast Action. Real Results." },
  { slug: "her-power", href: "/products/her-power", label: "MWP Her Power", tag: "Her Inner Miracle" },
  { slug: "her-energy", href: "/products/her-energy", label: "MWP Her Energy", tag: "Keeps Up With Her" },
  { slug: "daily-vitality", href: "/products/daily-vitality", label: "MWP Daily Vitality", tag: "Age Is A Number" },
  { slug: "alpha-prime", href: "/products/alpha-prime", label: "MWP Alpha Prime", tag: "Strength. Focus. Performance." },
  { slug: "titan-force", href: "/products/titan-force", label: "MWP Titan Force", tag: "Power For Your Everyday." },
];

const NAV_LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/ingredients", labelKey: "ingredients", icon: IconLeaf },
  { href: "/university", labelKey: "university", icon: IconSchool },
  { href: "/founder", labelKey: "founderLetter", icon: IconWriting },
  { href: "/certificates", labelKey: "certificateWall", icon: IconCertificate },
  { href: "/contact", labelKey: "contact", icon: IconPhone },
];

const ANNOUNCEMENTS = [
  "DISCOVER ALL EIGHT MWP FORMULAS | SHIPPING CONFIRMED AT CHECKOUT",
];

const getImg = (p) => {
  const raw = p.images?.find(image => image.isPrimary)?.url || p.image || p.images?.[0]?.url;
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

function FormulaMenuCard({ item, active, onClick }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn("group flex min-h-[96px] items-center gap-3 rounded-2xl border bg-white p-3 transition-colors sm:gap-4", active ? "border-[#A8741F]" : "border-neutral-200 hover:border-[#A8741F]")}
    >
      <span className="relative h-[72px] w-10 shrink-0 sm:w-12">
        <Image src={item.image || `/products/cutouts/${item.slug}.webp`} alt={item.name || item.slug} fill sizes="48px" className="object-contain" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] leading-5 text-neutral-900 sm:text-sm">{item.label.replace(/^MWP /, "")}</span>
        <span className="mt-1 block text-[10px] leading-4 text-neutral-500 sm:text-[11px]">{item.tag}</span>
      </span>
      <IconArrowUpRight className="hidden h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-[#A8741F] sm:block" stroke={1.5} />
    </Link>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count: compareCount } = useCompare();
  const { getCartItemCount } = useCart();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState([]);

  const catCloseTimer = useRef(null);
  const menuTriggerRef = useRef(null);
  const productMenuRef = useRef(null);

  useEffect(() => {
    if (!isProductsOpen) return;
    let alive = true;
    fetchApi("/public/products?limit=100")
      .then(res => { if (alive) setMenuProducts(res.data?.products || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [isProductsOpen]);

  const productMenu = PRODUCT_MENU.map(item => {
    const product = menuProducts.find(product => product.slug === item.slug);
    return { ...item, image: product ? getImg(product) : `/products/cutouts/${item.slug}.webp` };
  });

  const openProducts = () => {
    if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
    setIsProductsOpen(true);
  };
  const closeProductsSoon = () => {
    catCloseTimer.current = setTimeout(() => setIsProductsOpen(false), 150);
  };

  useEffect(() => {
    if (!isProductsOpen) return;
    const onPointerDown = event => {
      if (!productMenuRef.current?.contains(event.target)) setIsProductsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isProductsOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => { if (desktop.matches) setIsMenuOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
      if (catCloseTimer.current) clearTimeout(catCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setIsProductsOpen(false);
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
      <header className="sticky top-0 left-0 right-0 z-50 w-full bg-white text-neutral-900 border-b border-neutral-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.025)]">
        {/* Keep header geometry constant so scrolling cannot toggle its height. */}
        <div className="h-8 overflow-hidden bg-white border-b border-neutral-100">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 flex items-center justify-center lg:justify-between h-8 gap-6 text-[9px] sm:text-[10px] text-neutral-500">
            <span className="flex min-w-0 items-center gap-2 tracking-[0.08em]">
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#A8741F]" />
              <span className="sm:hidden">Eight formulas. One everyday routine.</span>
              <span className="hidden sm:block truncate">{ANNOUNCEMENTS[0]}</span>
            </span>
            <span className="hidden lg:inline-flex shrink-0 items-center gap-2 text-green-700"><IconShieldCheck className="h-3.5 w-3.5" stroke={1.5} /> Third-Party Lab Tested · Non-GMO · Vegan</span>
          </div>
        </div>

        {/* Main Header Bar — Logo on left, Menu in center, Actions on right (NEVER hides on scroll) */}
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
          <div className="flex h-[72px] sm:h-[80px] items-center justify-between gap-3 sm:gap-5">
            {/* 1. Left — Brand Logo */}
            <Link
              href="/"
              aria-label="MWP home"
              className="flex items-center shrink-0 focus-visible:outline-offset-4"
            >
              <Image
                src="/mwp-logo-2.png"
                alt="MWP SUPPLEMENTS"
                width={200}
                height={72}
                className="h-11 sm:h-14 w-auto object-contain"
                priority
              />
            </Link>

            {/* 2. Center — Navigation Menu (Desktop & Laptop) */}
            <nav aria-label="Main navigation" className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-0.5 2xl:gap-1">
              {/* ALL PRODUCTS dropdown */}
              <div
                ref={productMenuRef}
                className="relative"
                onMouseEnter={openProducts}
                onMouseLeave={closeProductsSoon}
                onKeyDown={event => { if (event.key === "Escape") setIsProductsOpen(false); }}
              >
                <button
                  onClick={event => setIsProductsOpen(value => event.detail === 0 ? !value : true)}
                  className={cn(
                    "flex h-10 items-center gap-2 px-4 text-[12px] transition-colors rounded-full whitespace-nowrap border",
                    isProductsOpen || pathname === "/products"
                      ? "bg-neutral-900 border-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-900 hover:border-neutral-900"
                  )}
                  aria-haspopup="true"
                  aria-controls="desktop-product-links"
                  aria-expanded={isProductsOpen}
                >
                  {t("allProducts")}
                  <IconChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      isProductsOpen && "rotate-180"
                    )}
                    stroke={2}
                  />
                </button>

                <AnimatePresence>
                  {isProductsOpen && (
                    <motion.div
                      id="desktop-product-links"
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute left-0 top-full mt-4 flex max-h-[calc(100dvh-144px)] w-[720px] max-w-[90vw] flex-col bg-white border border-neutral-200 rounded-3xl shadow-[0_24px_60px_-24px_rgba(20,35,28,0.24)] overflow-hidden z-[70]"
                    >
                      <div className="flex shrink-0 items-center justify-between gap-6 px-6 py-5 border-b border-neutral-100">
                        <div><span className="text-[9px] uppercase tracking-[0.2em] text-[#A8741F]">
                          {t("allProducts")}
                        </span>
                        <p className="mt-1.5 text-xl tracking-tight">Find your everyday formula.</p></div>
                        <span className="rounded-full border border-neutral-200 px-3 py-1.5 text-[11px] text-neutral-500">08 formulas</span>
                      </div>
                      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 grid grid-cols-2 gap-3">
                        {productMenu.map(item => <FormulaMenuCard key={item.href} item={item} active={pathname === item.href} onClick={() => setIsProductsOpen(false)} />)}
                      </div>
                      <div className="flex shrink-0 items-center justify-between px-6 py-4 border-t border-neutral-200">
                        <Link
                          href="/products"
                          onClick={() => setIsProductsOpen(false)}
                          className="rounded-full bg-neutral-900 px-4 py-2.5 text-xs text-white hover:bg-neutral-700 transition-colors inline-flex items-center gap-3"
                        >
                          {t("viewAll")} <IconArrowUpRight className="h-3 w-3" />
                        </Link>
                        <Link href="/quiz" onClick={() => setIsProductsOpen(false)} className="inline-flex items-center gap-2 text-xs text-green-700">{t("findYourFormula")} <IconArrowUpRight className="h-3.5 w-3.5" /></Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {NAV_LINKS.map(({ href, labelKey, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-2.5 py-3 text-[12px] transition-colors whitespace-nowrap",
                      active
                        ? "text-neutral-900 bg-white"
                        : "text-neutral-500 hover:text-neutral-950"
                    )}
                  >
                    {label || t(labelKey)}
                    {active && (
                      <span className="absolute bottom-1 left-2.5 right-2.5 h-px bg-[#A8741F]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* 3. Right — Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 xl:border-l xl:border-neutral-200 xl:pl-4">
              {/* Search button — opens interactive live search dialog */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center justify-center w-9 h-10 sm:w-10 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors rounded-xl"
                aria-label="Search"
                title="Search products"
              >
                <IconSearch className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
              </button>

              <ClientOnly>
                {isAuthenticated ? (
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center justify-center w-9 h-9 hover:bg-neutral-100 transition-colors rounded-full"
                    aria-label="Account"
                  >
                    <AvatarCircle name={user?.name} size="sm" />
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    className="hidden sm:flex items-center justify-center w-9 h-9 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors rounded-full"
                    aria-label="Login"
                  >
                    <IconUser className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                  </Link>
                )}
              </ClientOnly>

              <Link
                href="/compare"
                className="hidden xl:flex relative items-center justify-center w-9 h-9 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors rounded-full"
                aria-label="Compare"
              >
                <IconGitCompare className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                {compareCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white rounded-full">
                    {compareCount}
                  </span>
                )}
              </Link>

              <Link
                href="/wishlist"
                className="hidden xl:flex items-center justify-center w-9 h-9 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors rounded-full"
                aria-label="Wishlist"
              >
                <IconHeart className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
              </Link>

              <ClientOnly>
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center w-10 h-10 sm:w-11 bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-700 transition-colors rounded-xl"
                  aria-label="Cart"
                >
                  <IconShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5" stroke={2} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-neutral-900 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full shadow">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </ClientOnly>

              {/* Mobile Menu Button with clear tap target */}
              <button
                ref={menuTriggerRef}
                onClick={() => setIsMenuOpen(true)}
                className="xl:hidden flex items-center justify-center w-10 h-10 bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900 transition-colors rounded-xl ml-1"
                aria-label="Toggle Menu"
                aria-expanded={isMenuOpen}
                aria-haspopup="dialog"
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
        triggerRef={menuTriggerRef}
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
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [active, setActive] = useState(-1);
  const searchInputRef = useRef(null);
  const cacheRef = useRef(new Map());

  const term = searchQuery.trim();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    fetchApi("/public/products?limit=8")
      .then(res => { if (alive) setSuggestedProducts(res?.data?.products || []); })
      .catch(() => { if (alive) setSuggestedProducts([]); });
    return () => { alive = false; };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
    setSearchQuery("");
    setResults([]);
    setActive(-1);
  }, [open]);

  // Debounced live search: waits 250ms after the last keystroke, ignores stale answers, remembers earlier terms
  useEffect(() => {
    setActive(-1);
    if (!open || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const key = term.toLowerCase();
    if (cacheRef.current.has(key)) {
      setResults(cacheRef.current.get(key));
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetchApi(`/public/products?search=${encodeURIComponent(term)}&limit=6`);
        const list = res?.data?.products || [];
        cacheRef.current.set(key, list);
        if (!cancelled) setResults(list);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term, open]);

  const goAll = () => {
    if (!term) return;
    onOpenChange(false);
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  const goProduct = slug => {
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  const handleSubmit = event => {
    event?.preventDefault();
    if (active >= 0 && results[active]) return goProduct(results[active].slug);
    goAll();
  };

  const handleKeyDown = event => {
    if (!results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(i => (i + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(i => (i <= 0 ? results.length - 1 : i - 1)); }
  };

  const clean = name => String(name || "").replace(/[\u2122\u00ae]/g, "").replace(/^MWP /, "");
  const popularProducts = suggestedProducts.length ? suggestedProducts : PRODUCT_MENU.map(item => ({
    id: item.slug,
    slug: item.slug,
    name: item.label,
    image: `/products/cutouts/${item.slug}.webp`,
  }));
  const priceOf = p => {
    const n = parseFloat(p.salePrice || p.price || p.basePrice || p.minPrice);
    return Number.isFinite(n) && n > 0 ? `$${n.toFixed(2)}` : null;
  };
  // bold the part of the name that matches what was typed
  const highlight = text => {
    const i = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark className="rounded-sm bg-[#F3E2B3] px-0.5 text-inherit">{text.slice(i, i + term.length)}</mark>{text.slice(i + term.length)}</>;
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-neutral-950/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby="mwp-search-description"
          className="mwp-search fixed left-1/2 top-[72px] z-[100] flex w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0 text-neutral-900 shadow-[0_20px_60px_rgba(18,33,63,0.22)] sm:top-[88px]"
        >
          <DialogPrimitive.Title className="sr-only">Search MWP</DialogPrimitive.Title>
          <p id="mwp-search-description" className="sr-only">Type to find a formula. Use the arrow keys to move through results and Enter to open one.</p>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-b border-neutral-200 px-4">
            <IconSearch className="h-5 w-5 shrink-0 text-neutral-500" stroke={1.6} />
            <input
              ref={searchInputRef}
              type="search"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="mwp-search-results"
              aria-label="Search formulas"
              autoComplete="off"
              placeholder="Search formulas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-w-0 flex-1 border-0 bg-transparent py-4 text-[15px] text-neutral-900 placeholder:text-neutral-500 focus:!outline-none focus-visible:!outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {loading && <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-800" />}
            {searchQuery && !loading && (
              <button type="button" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900" aria-label="Clear search">
                <IconX className="h-4 w-4" />
              </button>
            )}
            <DialogPrimitive.Close aria-label="Close search" className="hidden shrink-0 rounded-md border border-neutral-300 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100 sm:block">Esc</DialogPrimitive.Close>
          </form>

          <div id="mwp-search-results" className="max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain p-2">
            {term.length >= 2 ? (
              loading && results.length === 0 ? (
                <div role="status" aria-label="Searching" className="space-y-2 p-1">
                  {[0, 1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-neutral-100" />)}
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-neutral-900">No matches for &ldquo;{term}&rdquo;</p>
                  <p className="mt-1 text-xs text-neutral-600">Try another name, or browse every formula.</p>
                  <Link href="/products" onClick={() => onOpenChange(false)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs text-white">Browse all formulas <IconArrowUpRight className="h-3.5 w-3.5" /></Link>
                </div>
              ) : (
                <ul role="listbox" aria-label="Search results">
                  {results.map((p, i) => {
                    const price = priceOf(p);
                    return (
                      <li key={p.id || p.slug} role="option" aria-selected={i === active}>
                        <button
                          type="button"
                          onClick={() => goProduct(p.slug)}
                          onMouseEnter={() => setActive(i)}
                          className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${i === active ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
                        >
                          <span className="relative h-11 w-9 shrink-0"><Image src={getImg(p)} alt={p.name} fill sizes="36px" className="object-contain" /></span>
                          <span className="min-w-0 flex-1 truncate text-sm text-neutral-900">{highlight(clean(p.name))}</span>
                          {price && <span className="shrink-0 text-xs text-[#A8741F]">{price}</span>}
                          <IconArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button type="button" onClick={goAll} className="mt-1 flex w-full items-center justify-between rounded-xl border-t border-neutral-100 px-3 py-2.5 text-xs text-neutral-700 hover:bg-neutral-50">
                      <span>See all results for &ldquo;{term}&rdquo;</span><IconArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </li>
                </ul>
              )
            ) : (
              <div className="space-y-4 p-2">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-neutral-600">Popular</p>
                  <div className="flex flex-wrap gap-1.5">
                    {popularProducts.slice(0, 8).map(p => (
                      <button key={p.id || p.slug} type="button" onClick={() => setSearchQuery(clean(p.name))} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900">{clean(p.name)}</button>
                    ))}
                  </div>
                </div>
                {categories.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-neutral-600">Shop by goal</p>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.slice(0, 6).map(c => (
                        <Link key={c.id || c.slug} href={"/category/" + c.slug} onClick={() => onOpenChange(false)} className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-800 transition-colors hover:bg-neutral-200">{c.name}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50 px-4 py-2.5 text-[11px] text-neutral-600">
            <span className="hidden sm:inline">Use &uarr; &darr; to move, Enter to open</span>
            <Link href="/products" onClick={() => onOpenChange(false)} className="ml-auto inline-flex items-center gap-1 text-neutral-800 hover:underline">Browse all <IconArrowUpRight className="h-3 w-3" /></Link>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MobileMenu({
  isOpen,
  onClose,
  triggerRef,
  user,
  isAuthenticated,
  categories,
  cartCount,
  compareCount = 0,
  handleLogout,
  pathname,
  onOpenSearch,
}) {
  const { t } = useLanguage();
  const [productsExpanded, setProductsExpanded] = useState(true);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-neutral-950/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus(); }}
          className="fixed right-0 top-0 z-[80] flex h-[100dvh] w-[calc(100%-20px)] max-w-[420px] flex-col overflow-hidden rounded-l-3xl border-l border-neutral-200 bg-white text-neutral-900 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300 motion-reduce:animate-none"
        >
            <DialogPrimitive.Title className="sr-only">MWP navigation menu</DialogPrimitive.Title>
            {/* 1. Header with Logo & Close button */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white">
              <div className="flex items-center">
                <Image
                  src="/mwp-logo-2.png"
                  alt="MWP SUPPLEMENTS"
                  width={130}
                  height={50}
                  className="h-10 w-auto object-contain"
                />
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-neutral-500 hover:text-neutral-950 hover:border-neutral-900 transition-colors rounded-full"
                aria-label="Close menu"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {/* 2. Quick Search & Quick Actions Bar */}
            <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white">
              <button
                onClick={onOpenSearch}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-neutral-300 rounded-2xl text-xs text-neutral-500 hover:text-neutral-950 hover:border-neutral-900 transition-colors"
              >
                <IconSearch className="h-4 w-4 text-neutral-400" />
                <span>Search supplements, ingredients…</span>
              </button>

              {/* Quick links: Compare & Wishlist on mobile */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-700 hover:text-[#A8741F] hover:bg-white transition-colors"
                >
                  <IconHeart className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Wishlist</span>
                </Link>
                <Link
                  href="/compare"
                  onClick={onClose}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 bg-white border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-700 hover:text-[#A8741F] hover:bg-white transition-colors relative"
                >
                  <IconGitCompare className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Compare</span>
                  {compareCount > 0 && (
                    <span className="ml-1 bg-neutral-900 text-white text-[9px] font-bold px-1 rounded-full">
                      {compareCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* 3. User Authentication Box */}
            <div className="px-6 py-4 border-b border-neutral-100 bg-white">
              <ClientOnly>
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarCircle name={user?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-neutral-900 truncate">
                          {user?.name || "Athlete"}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href="/account"
                        onClick={onClose}
                        className="px-2.5 py-1.5 bg-white hover:bg-white text-neutral-900 text-[11px] font-bold rounded-lg uppercase transition-colors"
                      >
                        Account
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-2 py-1 text-[11px] text-neutral-500 hover:text-neutral-950 transition-colors"
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
                      className="py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-[11px] uppercase tracking-wider text-center rounded-lg transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth?tab=register"
                      onClick={onClose}
                      className="py-2.5 px-3 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-bold text-[11px] uppercase tracking-wider text-center rounded-lg transition-all"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </ClientOnly>
            </div>

            {/* 4. Scrollable Navigation */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-6">
              {/* ALL PRODUCTS group */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setProductsExpanded((v) => !v)}
                  aria-expanded={productsExpanded}
                  aria-controls="mobile-product-links"
                  className="w-full flex items-center justify-between mb-4 text-[11px] uppercase tracking-[0.16em] text-neutral-500"
                >
                  <span>{t("allProducts")}</span>
                  <IconChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      productsExpanded && "rotate-180"
                    )}
                  />
                </button>
                {productsExpanded && <div id="mobile-product-links" className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                  {PRODUCT_MENU.map(item => <FormulaMenuCard key={item.href} item={item} active={pathname === item.href} onClick={onClose} />)}
                </div>}
                <Link href="/products" onClick={onClose} className="!mt-3 flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 text-xs text-neutral-700 hover:border-neutral-900">{t("viewAll")} {t("products")} <IconArrowUpRight className="h-4 w-4" /></Link>
              </div>

              {/* Primary nav */}
              <div className="space-y-1 pt-5 border-t border-neutral-200">
                <p className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500 px-2 mb-1.5">
                  Menu
                </p>
                {NAV_LINKS.map(({ href, labelKey, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={cn(
                        "flex min-h-12 items-center justify-between py-3 px-2 text-[13px] transition-colors rounded-xl",
                        active
                          ? "text-neutral-900 bg-white font-extrabold"
                          : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {Icon && (
                          <Icon className="h-4 w-4 text-[#A8741F]" stroke={2} />
                        )}
                        <span>{label || t(labelKey)}</span>
                      </div>
                      <IconChevronRight className="h-3.5 w-3.5 opacity-40" />
                    </Link>
                  );
                })}
              </div>

              {/* Categories Section */}
              {categories.length > 0 && (
                <div className="pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-extrabold text-neutral-500">
                      {t("categories")}
                    </span>
                    <Link
                      href="/categories"
                      onClick={onClose}
                      className="text-[10px] uppercase font-bold text-neutral-500 hover:text-[#A8741F] inline-flex items-center gap-0.5"
                    >
                      {t("viewAll")} <IconArrowUpRight className="h-3 w-3" />
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
                            "flex items-center justify-between py-2.5 px-3 text-xs rounded-lg transition-colors",
                            active
                              ? "bg-white text-neutral-900 font-bold"
                              : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100"
                          )}
                        >
                          <span className="truncate">{c.name}</span>
                          {c._count?.products ? (
                            <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
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
            <div className="px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] border-t border-neutral-100 bg-white space-y-3">
              <div className="flex items-center justify-center gap-4 text-neutral-500">
                <a
                  href="https://www.instagram.com/mwpsupplements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-950 transition-colors"
                  aria-label="Instagram"
                >
                  <IconBrandInstagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com/mwpsupplements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neutral-950 transition-colors"
                  aria-label="Facebook"
                >
                  <IconBrandFacebook className="h-4 w-4" />
                </a>
                <span className="text-neutral-300">|</span>
                <span className="text-[10px] text-[#A8741F] font-semibold inline-flex items-center gap-1">
                  <IconShieldCheck className="h-3.5 w-3.5" /> 100% Lab Tested
                </span>
              </div>
              <p className="text-[9px] text-neutral-500 tracking-wider uppercase font-semibold text-center">
                MEN | WOMEN | POWER &bull; MWP SUPPLEMENTS
              </p>
            </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default Navbar;
