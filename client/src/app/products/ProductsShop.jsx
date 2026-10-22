"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconSearch, IconX, IconChevronLeft, IconChevronRight, IconArrowRight, IconFlask2, IconShieldCheck, IconTruckDelivery, IconSparkles, IconArrowsSort } from "@tabler/icons-react";
import { ProductCard } from "@/components/products/ProductCard";
import "./products.css";

const PAGE_SIZE = 12;
const SORTS = [
  ["featured", "Featured"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["name", "Name: A to Z"],
];

const priceOf = (p) => {
  const n = parseFloat(p.basePrice ?? p.regularPrice ?? p.price ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const categoriesOf = (p) => (p.category ? [p.category] : (p.categories || []).map((c) => c.category || c).filter(Boolean));

function buildHref({ category, search, sort, page }) {
  const q = new URLSearchParams();
  if (category && category !== "all") q.set("category", category);
  if (search) q.set("search", search);
  if (sort && sort !== "featured") q.set("sort", sort);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `/products${s ? `?${s}` : ""}`;
}

function pageList(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap-" + n);
    out.push(n);
  });
  return out;
}

export default function ProductsShop({ products = [], categories = [], initial = {}, failed = false }) {
  const router = useRouter();
  const [category, setCategory] = useState(initial.category || "all");
  const [search, setSearch] = useState(initial.search || "");
  const [sort, setSort] = useState(initial.sort || "featured");
  const [page, setPage] = useState(initial.page || 1);
  const first = useRef(true);

  // keep the address bar in step (shareable links), without reloading the page
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => router.replace(buildHref({ category, search: search.trim(), sort, page }), { scroll: false }), 250);
    return () => clearTimeout(t);
  }, [category, search, sort, page, router]);

  const counts = useMemo(() => {
    const map = { all: products.length };
    products.forEach((p) => categoriesOf(p).forEach((c) => (map[c.slug] = (map[c.slug] || 0) + 1)));
    return map;
  }, [products]);

  const visibleCategories = categories.filter((c) => counts[c.slug] > 0);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = products.filter((p) => {
      if (category !== "all" && !categoriesOf(p).some((c) => c.slug === category)) return false;
      if (!term) return true;
      return `${p.name} ${String(p.description || "").replace(/<[^>]*>/g, " ")} ${categoriesOf(p).map((c) => c.name).join(" ")}`.toLowerCase().includes(term);
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else list = [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return list;
  }, [products, category, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasFilters = category !== "all" || search.trim() || sort !== "featured";

  const reset = () => {
    setCategory("all");
    setSearch("");
    setSort("featured");
    setPage(1);
  };
  const pickCategory = (slug) => {
    setCategory(slug);
    setPage(1);
  };

  return (
    <div className="mwp-shop">
      {/* Hero */}
      <section className="mwp-shop-hero">
        <div className="mwp-shop-wrap">
          <p className="mwp-shop-kicker">The MWP collection</p>
          <h1>Find the formula that fits your everyday.</h1>
          <p className="mwp-shop-lead">
            {products.length} clean, lab-tested formulas for men and women. Pick a goal below, or open any formula to see exactly what is inside.
          </p>
          <ul className="mwp-shop-trust">
            <li><IconFlask2 size={16} stroke={1.6} /> Third-party lab tested</li>
            <li><IconShieldCheck size={16} stroke={1.6} /> Made in the USA</li>
            <li><IconTruckDelivery size={16} stroke={1.6} /> Ships with USPS, UPS and FedEx</li>
          </ul>
        </div>
      </section>

      {/* Toolbar */}
      <div className="mwp-shop-toolbar">
        <div className="mwp-shop-wrap mwp-shop-toolbar-inner">
          <div className="mwp-shop-pills" role="group" aria-label="Shop by goal">
            <button type="button" aria-pressed={category === "all"} onClick={() => pickCategory("all")}>
              All <span>{counts.all}</span>
            </button>
            {visibleCategories.map((c) => (
              <button key={c.id || c.slug} type="button" aria-pressed={category === c.slug} onClick={() => pickCategory(c.slug)}>
                {c.name} <span>{counts[c.slug]}</span>
              </button>
            ))}
          </div>

          <div className="mwp-shop-controls">
            <label className="mwp-shop-search">
              <IconSearch size={17} stroke={1.6} aria-hidden="true" />
              <span className="sr-only">Search formulas</span>
              <input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search formulas" />
              {search && (
                <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>
                  <IconX size={15} />
                </button>
              )}
            </label>
            <label className="mwp-shop-sort">
              <IconArrowsSort size={16} stroke={1.6} aria-hidden="true" />
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mwp-shop-wrap mwp-shop-body">
        <div className="mwp-shop-meta" aria-live="polite">
          <p>
            Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "formula" : "formulas"}
            {category !== "all" && visibleCategories.find((c) => c.slug === category) ? <> in <strong>{visibleCategories.find((c) => c.slug === category).name}</strong></> : null}
            {search.trim() ? <> for &ldquo;{search.trim()}&rdquo;</> : null}
          </p>
          {hasFilters && <button type="button" onClick={reset}>Clear all <IconX size={13} /></button>}
        </div>

        {failed ? (
          <div className="mwp-shop-empty" role="alert">
            <IconSparkles size={30} stroke={1.3} />
            <h2>The shop could not load</h2>
            <p>Please try again in a moment.</p>
            <button type="button" onClick={() => router.refresh()}>Try again</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="mwp-shop-empty">
            <IconSearch size={30} stroke={1.3} />
            <h2>No formulas match that</h2>
            <p>Try a different word or clear your filters to see every formula.</p>
            <button type="button" onClick={reset}>Show all formulas</button>
          </div>
        ) : (
          <div className="mwp-shop-grid">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mwp-shop-pagination" aria-label="Product pages">
            {current > 1 ? (
              <Link href={buildHref({ category, search: search.trim(), sort, page: current - 1 })} rel="prev" onClick={(e) => { e.preventDefault(); setPage(current - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn" aria-label="Previous page"><IconChevronLeft size={16} /> <span>Previous</span></Link>
            ) : <span className="btn is-disabled"><IconChevronLeft size={16} /> <span>Previous</span></span>}
            <ul>
              {pageList(current, totalPages).map((n) => typeof n === "string"
                ? <li key={n} className="gap" aria-hidden="true">&hellip;</li>
                : <li key={n}><Link href={buildHref({ category, search: search.trim(), sort, page: n })} onClick={(e) => { e.preventDefault(); setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={`num${n === current ? " is-current" : ""}`} aria-current={n === current ? "page" : undefined} aria-label={`Page ${n}`}>{n}</Link></li>)}
            </ul>
            {current < totalPages ? (
              <Link href={buildHref({ category, search: search.trim(), sort, page: current + 1 })} rel="next" onClick={(e) => { e.preventDefault(); setPage(current + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="btn" aria-label="Next page"><span>Next</span> <IconChevronRight size={16} /></Link>
            ) : <span className="btn is-disabled"><span>Next</span> <IconChevronRight size={16} /></span>}
          </nav>
        )}
      </section>

      {/* Help band */}
      <section className="mwp-shop-wrap mwp-shop-help">
        <div>
          <p className="mwp-shop-kicker dark">Not sure where to start?</p>
          <h2>Answer a few questions and we will point you to your formula.</h2>
          <p>Or put two to five formulas side by side and compare them.</p>
        </div>
        <div className="mwp-shop-help-actions">
          <Link href="/quiz" className="primary">Find your formula <IconArrowRight size={16} /></Link>
          <Link href="/compare" className="secondary">Compare formulas</Link>
        </div>
      </section>
    </div>
  );
}
