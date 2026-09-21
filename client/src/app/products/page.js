"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import {
  IconChevronLeft,
  IconChevronRight,
  IconLayoutGrid,
  IconSlidersHorizontal,
  IconX,
  IconSearch,
  IconAdjustments,
} from "@tabler/icons-react";
import { ClientOnly } from "@/components/client-only";
import { ProductCard } from "@/components/products/ProductCard";
import Link from "next/link";

function ProductCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden animate-pulse" style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}>
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-5 space-y-3 flex flex-col items-center">
        <div className="h-2.5 bg-gray-100 w-16" />
        <div className="h-3.5 bg-gray-100 w-full" />
        <div className="h-3.5 bg-gray-100 w-2/3" />
        <div className="h-4 bg-gray-100 w-20 mt-2" />
      </div>
    </div>
  );
}

function FilterSection({ title, isOpen, onToggle, children }) {
  return (
    <div className="py-5" style={{ borderBottom: "1px solid #EAEAEA" }}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] font-medium group-hover:text-neutral-800 transition-colors text-gray-900">
          {title}
        </span>
        <span
          className="text-lg font-light transition-transform duration-300"
          style={{ color: "#666666", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          maxHeight: isOpen ? "400px" : "0",
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? "20px" : "0",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const decodePlus = (s) => (s ? s.replace(/\+/g, " ") : "");
  const searchQuery = decodePlus(searchParams.get("search") || "");
  const categorySlug = searchParams.get("category") || "";
  const productType = searchParams.get("productType") || "";
  const colorId = searchParams.get("color") || "";
  const sizeId = searchParams.get("size") || "";
  const genderParam = searchParams.get("gender") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortParam = searchParams.get("sort") || "createdAt";
  const orderParam = searchParams.get("order") || "desc";
  const pageParam = parseInt(searchParams.get("page")) || 1;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewCols, setViewCols] = useState(4);
  const [viewMode, setViewMode] = useState("grid");

  const [selectedColors, setSelectedColors] = useState(colorId ? [colorId] : []);
  const [selectedSizes, setSelectedSizes] = useState(sizeId ? [sizeId] : []);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [openSections, setOpenSections] = useState({ categories: true, gender: true, price: true, color: true, size: true });

  const [priceCap, setPriceCap] = useState(10000);
  const [priceRange, setPriceRange] = useState({ min: Number(minPrice) || 0, max: Number(maxPrice) || 10000 });
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Real price ceiling from the catalogue
  useEffect(() => {
    fetchApi("/public/products/max-price")
      .then((r) => {
        const cap = Math.ceil((r?.data?.maxPrice || 10000) / 100) * 100;
        setPriceCap(cap);
        setPriceRange((pr) => ({
          min: pr.min,
          max: maxPrice ? Number(maxPrice) : cap,
        }));
      })
      .catch(() => {});
  }, []); // eslint-disable-line
  const [pagination, setPagination] = useState({ page: pageParam, limit: 12, total: 0, pages: 0 });

  const [filters, setFilters] = useState({
    search: searchQuery, category: categorySlug, productType,
    color: colorId, size: sizeId, gender: genderParam,
    minPrice, maxPrice,
    sort: sortParam, order: orderParam,
  });

  useEffect(() => { setSearchInput(filters.search || ""); }, [filters.search]);

  useEffect(() => {
    Promise.all([
      fetchApi("/public/categories"),
      fetchApi("/public/filter-attributes"),
    ]).then(([catRes, attrRes]) => {
      setCategories(catRes.data.categories || []);
      setColors(attrRes.data.colors || []);
      setSizes(attrRes.data.sizes || []);
      if (Array.isArray(attrRes.data.attributes)) {
        setAllAttributes(attrRes.data.attributes);
      } else {
        const attrs = [];
        if (attrRes.data.colors?.length) attrs.push({ id: "color-attr", name: "Color", values: attrRes.data.colors });
        if (attrRes.data.sizes?.length) attrs.push({ id: "size-attr", name: "Size", values: attrRes.data.sizes });
        setAllAttributes(attrs);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let response;
        if (filters.productType) {
          const q = new URLSearchParams({ limit: String(pagination.limit * pagination.page) });
          response = await fetchApi(`/public/products/type/${filters.productType}?${q}`);
          const all = response.data?.products || [];
          const s = (pagination.page - 1) * pagination.limit;
          setProducts(all.slice(s, s + pagination.limit));
          setPagination((p) => ({ ...p, total: all.length, pages: Math.ceil(all.length / p.limit) }));
        } else {
          const q = new URLSearchParams({
            page: String(pagination.page),
            limit: String(pagination.limit),
            sort: ["createdAt", "updatedAt", "name", "price", "featured"].includes(filters.sort) ? filters.sort : "createdAt",
            order: filters.order,
          });
          if (filters.search) q.append("search", filters.search);
          if (filters.category) q.append("category", filters.category);
          if (filters.gender) q.append("gender", filters.gender);
          if (filters.minPrice) q.append("minPrice", filters.minPrice);
          if (filters.maxPrice) q.append("maxPrice", filters.maxPrice);

          const attrIds = new Set();
          if (selectedColors.length > 0) { q.append("color", selectedColors[0]); selectedColors.forEach((id) => attrIds.add(id)); }
          if (selectedSizes.length > 0) { q.append("size", selectedSizes[0]); selectedSizes.forEach((id) => attrIds.add(id)); }
          Object.keys(selectedAttributes).forEach((k) => {
            if (k !== "color" && k !== "size") (selectedAttributes[k] || []).forEach((id) => attrIds.add(id));
          });
          if (attrIds.size > 0) q.append("attributeValueIds", [...attrIds].join(","));

          response = await fetchApi(`/public/products?${q}`);
          setProducts(response.data.products || []);
          setPagination(response.data.pagination || {});
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters, pagination.page, selectedColors, selectedSizes, selectedAttributes]);

  const updateURL = (f) => {
    const pairs = [];
    const add = (k, v) => {
      if (v !== undefined && v !== null && v !== "")
        pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v)).replace(/%20/g, "+")}`);
    };
    add("search", f.search); add("category", f.category); add("productType", f.productType);
    add("color", f.color); add("size", f.size); add("gender", f.gender);
    add("minPrice", f.minPrice); add("maxPrice", f.maxPrice);
    if (f.sort !== "createdAt" || f.order !== "desc") { add("sort", f.sort); add("order", f.order); }
    if (f.page > 1) add("page", f.page);
    router.push(pairs.length ? `?${pairs.join("&")}` : window.location.pathname, { scroll: false });
  };

  const handleFilterChange = (name, value) => {
    const nf = { ...filters, [name]: value };
    setFilters(nf);
    updateURL(nf);
    if (pagination.page !== 1) setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleAttrChange = (attrName, valueId) => {
    const k = attrName.toLowerCase();
    const cur = selectedAttributes[k] || [];
    const updated = cur.includes(valueId) ? cur.filter((id) => id !== valueId) : [valueId];
    setSelectedAttributes((p) => ({ ...p, [k]: updated }));
    if (k === "color") { setSelectedColors(updated); handleFilterChange("color", updated[0] || ""); }
    else if (k === "size") { setSelectedSizes(updated); handleFilterChange("size", updated[0] || ""); }
  };

  const clearFilters = () => {
    const cf = { search: "", category: "", productType: "", color: "", size: "", gender: "", minPrice: "", maxPrice: "", sort: "createdAt", order: "desc" };
    setFilters(cf); setSelectedColors([]); setSelectedSizes([]); setSelectedAttributes({});
    setPriceRange({ min: 0, max: priceCap });
    updateURL(cf); setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleSortChange = (e) => {
    const map = {
      default: ["createdAt", "desc"],
      "price-asc": ["price", "asc"],
      "price-desc": ["price", "desc"],
      name: ["name", "asc"],
      featured: ["featured", "desc"]
    };
    const [sort, order] = map[e.target.value] || ["createdAt", "desc"];
    const nf = { ...filters, sort, order };
    setFilters(nf);
    updateURL(nf);
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: p }));
    const params = new URLSearchParams(searchParams.toString());
    p > 1 ? params.set("page", p) : params.delete("page");
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  const activeCount = [
    filters.search, filters.category, filters.productType,
    selectedColors.length > 0, selectedSizes.length > 0,
    filters.minPrice, filters.maxPrice,
    filters.gender,
  ].filter(Boolean).length;

  const getColsClass = () => {
    if (viewMode === "list") return "grid-cols-1";
    if (viewCols === 2) return "grid-cols-2";
    if (viewCols === 3) return "grid-cols-2 md:grid-cols-3";
    if (viewCols === 5) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5";
    return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  };

  const SidebarContent = () => (
    <div className="space-y-0">
      {/* Search */}
      <div className="pb-5" style={{ borderBottom: "1px solid #EAEAEA" }}>
        <div className="relative">
          <IconSearch className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#111111" }} stroke={1.5} />
          <input
            type="text"
            placeholder="Search supplements & formulas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilterChange("search", searchInput)}
            className="w-full h-10 pl-7 pr-4 text-[13px] bg-transparent focus:outline-none transition-colors placeholder:text-stone"
            style={{ borderBottom: "1px solid rgba(17,17,17,0.12)" }}
          />
        </div>
      </div>

      <FilterSection
        title="Collections"
        isOpen={!!openSections.categories}
        onToggle={() => setOpenSections((p) => ({ ...p, categories: !p.categories }))}
      >
        <ul className="space-y-1">
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleFilterChange("category", filters.category === cat.slug ? "" : cat.slug)}
                className="text-[12px] tracking-wide flex items-center justify-between w-full py-2.5 px-3 transition-all duration-300"
                style={{
                  color: filters.category === cat.slug ? "#111111" : "#666666",
                  backgroundColor: filters.category === cat.slug ? "rgba(184,151,106,0.06)" : "transparent",
                  borderRadius: "6px",
                }}
              >
                <span className="font-light">{cat.name}</span>
                {cat.productCount !== undefined && (
                  <span className="text-[10px]" style={{ color: "#999999" }}>{cat.productCount}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection
        title="Gender"
        isOpen={!!openSections.gender}
        onToggle={() => setOpenSections((p) => ({ ...p, gender: !p.gender }))}
      >
        <div className="flex flex-wrap gap-2">
          {[
            { value: "MEN", label: "Men" },
            { value: "WOMEN", label: "Women" },
            { value: "UNISEX", label: "Unisex" },
          ].map(({ value, label }) => {
            const active = filters.gender === value;
            return (
              <button
                key={value}
                onClick={() => handleFilterChange("gender", active ? "" : value)}
                className="px-4 py-2 text-[11px] tracking-[0.08em] transition-all duration-300 font-light"
                style={{
                  border: active ? "1px solid #111111" : "1px solid #EAEAEA",
                  backgroundColor: active ? "#111111" : "transparent",
                  color: active ? "#fff" : "#666666",
                  borderRadius: "6px",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection
        title="Price Range"
        isOpen={!!openSections.price}
        onToggle={() => setOpenSections((p) => ({ ...p, price: !p.price }))}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={priceCap}
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10"
              placeholder="Min"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              min="0"
              max={priceCap}
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) || priceCap })}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-[13px] font-semibold text-gray-800 focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10"
              placeholder="Max"
            />
          </div>
          <input
            type="range"
            min="0"
            max={priceCap}
            step="50"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
            className="w-full cursor-pointer accent-neutral-900"
            style={{ height: "3px" }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-semibold text-gray-600">
              ₹{priceRange.min.toLocaleString()} — ₹{priceRange.max.toLocaleString()}
            </span>
            <button
              onClick={() => {
                handleFilterChange("minPrice", priceRange.min > 0 ? String(priceRange.min) : "");
                handleFilterChange("maxPrice", priceRange.max < priceCap ? String(priceRange.max) : "");
              }}
              className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-[11px] uppercase tracking-[0.12em] font-bold hover:bg-neutral-900 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </FilterSection>

      {colors.length > 0 && (
        <FilterSection
          title="Colours"
          isOpen={!!openSections.color}
          onToggle={() => setOpenSections((p) => ({ ...p, color: !p.color }))}
        >
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => {
              const active = selectedColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleAttrChange("Color", c.id)}
                  className="w-9 h-9 transition-all duration-300"
                  style={{
                    backgroundColor: c.hexCode || "#fff",
                    borderRadius: "50%",
                    border: active ? "2px solid #111111" : "1px solid #EAEAEA",
                    transform: active ? "scale(1.1)" : "scale(1)",
                    boxShadow: active ? "0 0 0 3px rgba(184,151,106,0.15)" : "none",
                  }}
                  title={c.name}
                  aria-label={c.name}
                />
              );
            })}
          </div>
        </FilterSection>
      )}

      {sizes.length > 0 && (
        <FilterSection
          title="Sizes"
          isOpen={!!openSections.size}
          onToggle={() => setOpenSections((p) => ({ ...p, size: !p.size }))}
        >
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const active = selectedSizes.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => handleAttrChange("Size", s.id)}
                  className="min-w-[44px] px-3 py-2 text-[11px] tracking-[0.08em] transition-all duration-300 font-light"
                  style={{
                    border: active ? "1px solid #111111" : "1px solid #EAEAEA",
                    backgroundColor: active ? "#111111" : "transparent",
                    color: active ? "#fff" : "#666666",
                    borderRadius: "6px",
                  }}
                >
                  {s.display || s.name}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">

      {/* Shop Header */}
      <div className="bg-white" style={{ borderBottom: "1px solid #EAEAEA" }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-12 md:py-16 lg:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] mb-5 text-gray-500">
                <Link href="/" className="hover:text-neutral-800 transition-colors">Home</Link>
                <span style={{ color: "#111111" }}>·</span>
                <span className="text-gray-900">Shop</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] tracking-tight leading-[1.08] text-gray-900">
                {filters.search ? (
                  <>Results for <em className="italic" style={{ color: "#111111" }}>&ldquo;{filters.search}&rdquo;</em></>
                ) : (
                  <>MWP Performance <em className="italic" style={{ color: "#111111" }}>Formulas</em></>
                )}
              </h1>
              {pagination.total > 0 && (
                <p className="text-[11px] uppercase tracking-[0.2em] mt-4 font-light text-gray-500">
                  {pagination.total} {pagination.total === 1 ? "formula" : "formulas"}
                </p>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2.5 self-start transition-all duration-300"
              style={{
                padding: "12px 24px",
                border: "1px solid rgba(17,17,17,0.2)",
                borderRadius: "8px",
                fontSize: "10px",
                uppercase: true,
                letterSpacing: "0.2em",
                fontWeight: 500,
                color: "#111111",
              }}
            >
              <IconAdjustments className="h-4 w-4" stroke={1.5} />
              Filters
              {activeCount > 0 && (
                <span
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: "#111111", color: "#fff", borderRadius: "50%" }}
                >
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-28">
              <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "2px solid #111111" }}>
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-900">
                  Refine
                </h3>
                {activeCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[9px] uppercase tracking-[0.15em] font-medium hover:underline transition-colors"
                    style={{ color: "#111111" }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9">

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center gap-2.5 mb-8">
              {[
                { label: "Featured", type: "featured" },
                { label: "Best Sellers", type: "bestseller" },
                { label: "Trending", type: "trending" },
                { label: "New Arrivals", type: "new" },
              ].map(({ label, type }) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange("productType", filters.productType === type ? "" : type)}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] font-medium transition-all duration-300"
                  style={{
                    border: filters.productType === type ? "1px solid #111111" : "1px solid #EAEAEA",
                    backgroundColor: filters.productType === type ? "#111111" : "transparent",
                    color: filters.productType === type ? "#fff" : "#666666",
                    borderRadius: "8px",
                  }}
                >
                  {label}
                </button>
              ))}
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] font-medium transition-colors duration-300"
                  style={{
                    border: "1px solid rgba(194,75,66,0.3)",
                    color: "#C24B42",
                    borderRadius: "8px",
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4 pb-5 mb-8" style={{ borderBottom: "1px solid #EAEAEA" }}>
              <span className="text-[11px] uppercase tracking-[0.18em] font-light text-gray-500">
                {loading ? (
                  <span className="h-4 bg-gray-100 animate-pulse w-24 inline-block" style={{ borderRadius: "4px" }} />
                ) : (
                  <>Showing {products.length} of {pagination.total || 0}</>
                )}
              </span>

              <div className="flex items-center gap-4">
                {/* View Toggle */}
                <div className="hidden md:flex items-center" style={{ border: "1px solid #EAEAEA", borderRadius: "6px", overflow: "hidden" }}>
                  {[2, 3, 4].map((c) => (
                    <button
                      key={c}
                      onClick={() => { setViewMode("grid"); setViewCols(c); }}
                      className="w-9 h-9 flex items-center justify-center text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: viewMode === "grid" && viewCols === c ? "#111111" : "transparent",
                        color: viewMode === "grid" && viewCols === c ? "#fff" : "#666666",
                      }}
                      aria-label={`${c} columns`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <select
                  onChange={handleSortChange}
                  className="text-[11px] uppercase tracking-[0.12em] bg-transparent focus:outline-none cursor-pointer font-light"
                  style={{
                    padding: "10px 14px",
                    border: "1px solid #EAEAEA",
                    borderRadius: "6px",
                    color: "#111111",
                  }}
                >
                  <option value="default">Latest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name</option>
                  <option value="featured">Featured</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading && products.length === 0 ? (
              <div className={`grid gap-5 ${getColsClass()}`}>
                {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24" style={{ backgroundColor: "#FAFAFA", border: "1px solid #EAEAEA", borderRadius: "8px" }}>
                <span className="italic text-5xl block mb-6" style={{ color: "rgba(17,17,17,0.1)" }}>Nothing here…</span>
                <h3 className="text-2xl mb-3 text-gray-900">No products found</h3>
                <p className="text-[14px] mb-8 font-light text-gray-500">Try adjusting your filters or search terms.</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors duration-300"
                  style={{ backgroundColor: "#111111", color: "#fff", borderRadius: "8px" }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : ""} ${getColsClass()}`}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-14">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="w-11 h-11 flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid #EAEAEA",
                    borderRadius: "8px",
                    color: "#666666",
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "#111111"; e.currentTarget.style.color = "#111111"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; e.currentTarget.style.color = "#666666"; }}
                  aria-label="Previous page"
                >
                  <IconChevronLeft className="h-4 w-4" stroke={1.5} />
                </button>
                {[...Array(pagination.pages)].map((_, i) => {
                  const p = i + 1;
                  if (pagination.pages > 7 && p > 3 && p < pagination.pages - 1 && Math.abs(p - pagination.page) > 1) {
                    if (p === 4 || p === pagination.pages - 2) return <span key={p} className="text-[12px]" style={{ color: "#999999" }}>…</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className="w-11 h-11 text-[12px] font-medium flex items-center justify-center transition-all duration-300"
                      style={{
                        border: p === pagination.page ? "none" : "1px solid #EAEAEA",
                        backgroundColor: p === pagination.page ? "#111111" : "transparent",
                        color: p === pagination.page ? "#fff" : "#666666",
                        borderRadius: "8px",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                  className="w-11 h-11 flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    border: "1px solid #EAEAEA",
                    borderRadius: "8px",
                    color: "#666666",
                  }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.borderColor = "#111111"; e.currentTarget.style.color = "#111111"; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EAEAEA"; e.currentTarget.style.color = "#666666"; }}
                  aria-label="Next page"
                >
                  <IconChevronRight className="h-4 w-4" stroke={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(17,17,17,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col"
            style={{ borderTopLeftRadius: "16px", borderBottomLeftRadius: "16px" }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid #EAEAEA" }}>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-medium text-gray-900">Refine</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center transition-colors"
                style={{ borderRadius: "8px" }}
                aria-label="Close filters"
              >
                <IconX className="h-5 w-5 text-gray-500" stroke={1.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
              <SidebarContent />
            </div>
            <div className="p-5" style={{ borderTop: "1px solid #EAEAEA" }}>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full text-[11px] uppercase tracking-[0.2em] font-medium transition-colors duration-300"
                style={{
                  height: "52px",
                  backgroundColor: "#111111",
                  color: "#fff",
                  borderRadius: "8px",
                }}
              >
                Show {pagination.total || 0} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <ClientOnly fallback={<div className="p-8 text-center animate-pulse text-[11px] uppercase tracking-[0.3em] text-gray-500">Loading shop…</div>}>
        <Suspense fallback={<div className="p-8 text-center animate-pulse text-[11px] uppercase tracking-[0.3em] text-gray-500">Loading shop…</div>}>
          <ProductsContent />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
