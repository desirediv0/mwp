"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, sortCategories, cn } from "@/lib/utils";
import {
  IconSearch,
  IconArrowRight,
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconPackageOff,
} from "@tabler/icons-react";

const getImageUrl = (image) => {
  if (!image) return null;
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

/* ─── Category Card ─────────────────────────────────────── */
function CategoryCard({ category }) {
  const count = category._count?.products || 0;
  const img = getImageUrl(category.image);
  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.18)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {img ? (
            <Image
              src={img}
              alt={category.name}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
              <span className="text-6xl font-extrabold text-gray-300 select-none">
                {category.name?.charAt(0)?.toUpperCase() || "M"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
          <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <IconArrowUpRight className="h-4 w-4" stroke={2} />
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-1">{category.name}</h3>
            <p className="text-white/70 text-[11px] font-medium mt-0.5">
              {count > 0 ? `${count} ${count === 1 ? "product" : "products"}` : "Explore"}
            </p>
          </div>
        </div>
        {category.description && (
          <p className="px-4 py-3 text-[12.5px] text-gray-500 leading-relaxed line-clamp-2">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-200">
      <div className="aspect-[4/3] w-full bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debRef = useRef(null);
  const limit = 24;

  const fetchCategories = useCallback(async (page = 1, searchQuery = "", sortValue = "name-asc") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: sortValue });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetchApi(`/public/categories?${params.toString()}`);
      const cats = res.data?.categories || [];
      const pag = res.data?.pagination;
      if (pag) {
        setCategories(cats);
        setPagination(pag);
      } else {
        setCategories(sortCategories(cats));
        setPagination(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(1, "", "name-asc"); }, [fetchCategories]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setCurrentPage(1);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchCategories(1, value, sort), 300);
  };

  const handleSort = (e) => {
    setSort(e.target.value);
    setCurrentPage(1);
    fetchCategories(1, search, e.target.value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCategories(page, search, sort);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showPagination = pagination && pagination.pages > 1;
  const total = pagination?.total ?? categories.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-16 md:py-24 text-center">
          <nav className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Categories</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            {total} {total === 1 ? "Category" : "Categories"}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Shop by <span className="text-red-500">Category</span>
          </h1>
          <p className="text-white/60 max-w-lg mx-auto text-[14px] md:text-base leading-relaxed">
            Targeted nutritional protocols for strength, hormone balance, endurance, recovery, and daily wellness.
          </p>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-5 mt-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
            <IconPackageOff className="text-red-500 flex-shrink-0 w-5 h-5 mt-0.5" stroke={1.5} />
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Error Loading Categories</h3>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-10 md:pt-12 pb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" stroke={2} />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search categories…"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={handleSort}
              className="h-12 pl-5 pr-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-[13px] font-semibold appearance-none cursor-pointer focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all"
            >
              <option value="name-asc">Name: A → Z</option>
              <option value="name-desc">Name: Z → A</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Products</option>
            </select>
            <IconChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 h-4 w-4 text-gray-400 pointer-events-none" stroke={2} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pb-16 md:pb-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => <CategoryCardSkeleton key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
              <IconPackageOff className="w-8 h-8 text-red-500" stroke={1.5} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No Categories Found</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-[14px]">
              {search ? `No results for "${search}". Try a different search.` : "Categories will appear here once added."}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-[12px] uppercase tracking-wider font-bold hover:bg-red-700 transition-colors"
            >
              Browse All Products <IconArrowRight className="h-4 w-4" stroke={2} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {categories.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
            </div>

            {showPagination && (
              <div className="flex justify-center items-center mt-12 gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronLeft className="h-4 w-4" stroke={2} />
                </button>
                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1;
                  if (page === 1 || page === pagination.pages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-[13px] font-bold transition-colors",
                          currentPage === page ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-red-300"
                        )}
                      >
                        {page}
                      </button>
                    );
                  }
                  if ((page === 2 && currentPage > 3) || (page === pagination.pages - 1 && currentPage < pagination.pages - 2)) {
                    return <span key={page} className="text-gray-400 px-1">…</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <IconChevronRight className="h-4 w-4" stroke={2} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
