"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, ChevronLeft, LayoutGrid, List, Package } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse border border-gray-200">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/4 mt-3" />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let sort = "createdAt", order = "desc";
        if (sortOption === "oldest") { sort = "createdAt"; order = "asc"; }
        else if (sortOption === "name-asc") { sort = "name"; order = "asc"; }
        else if (sortOption === "name-desc") { sort = "name"; order = "desc"; }
        else if (sortOption === "price-asc") { sort = "price"; order = "asc"; }
        else if (sortOption === "price-desc") { sort = "price"; order = "desc"; }

        const res = await fetchApi(
          `/public/categories/${slug}/products?page=${pagination.page}&limit=${pagination.limit}&sort=${sort}&order=${order}`
        );
        setCategory(res.data.category);
        setProducts(res.data.products || []);
        setPagination((prev) => res.data.pagination || prev);
      } catch (err) {
        console.error("Error fetching category:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) run();
  }, [slug, pagination.page, pagination.limit, sortOption]);

  const handlePageChange = (n) => {
    if (n < 1 || n > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page: n }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- error ---------- */
  if (error) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center px-4">
        <div className="border border-gray-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-neutral-100 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-neutral-600" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Category Not Found</h2>
          <p className="text-gray-500 mb-6 text-[14px]">{error}</p>
          <Link href="/categories" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-[12px] uppercase tracking-wider font-bold hover:bg-neutral-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white flex items-end" style={{ minHeight: "clamp(300px, 38vw, 420px)" }}>
        {category?.image ? (
          <Image src={getImageUrl(category.image)} alt={category.name || ""} fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/55 to-black/30" />
        <div className="absolute -top-20 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none blur-2xl bg-white/10" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pb-10 md:pb-14 pt-24">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/50 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-white/80">{category?.name}</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
            <Package className="w-3.5 h-3.5" />
            {pagination.total} Product{pagination.total === 1 ? "" : "s"}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-3">
            {category?.name}
          </h1>
          {category?.description && (
            <p className="text-white/70 max-w-2xl text-[14px] md:text-[15px] leading-relaxed">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* ---------- Body ---------- */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-8 md:py-10">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-7 bg-white rounded-2xl p-3.5 border border-gray-200 shadow-sm">
          <p className="text-[13px] text-gray-500 font-medium px-1">
            Showing <span className="text-gray-900 font-bold">{products.length}</span> of {pagination.total}
          </p>

          <div className="flex items-center gap-2.5">
            {/* view mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-white text-neutral-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-white text-neutral-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* sort */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 rounded-lg px-3.5 py-2.5 pr-9 text-[13px] font-semibold cursor-pointer focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-neutral-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No Products Yet</h2>
            <p className="text-gray-500 mb-6 text-[14px]">This category doesn&apos;t have any products yet.</p>
            <Link href="/products" className="inline-flex items-center px-6 py-3 rounded-xl bg-neutral-900 text-white text-[12px] uppercase tracking-wider font-bold hover:bg-neutral-900 transition-colors">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className={cn("grid gap-4 md:gap-5", viewMode === "list" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-2 md:grid-cols-4 xl:grid-cols-5")}>
            {products.map((p) => <ProductCard key={p.id} product={p} viewMode={viewMode} />)}
          </div>
        )}

        {/* pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center mt-12 gap-1.5">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-neutral-800 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[...Array(pagination.pages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === pagination.pages || (page >= pagination.page - 1 && page <= pagination.page + 1)) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-10 h-10 rounded-lg font-bold text-[13px] transition-colors",
                      pagination.page === page ? "bg-neutral-900 text-white" : "bg-white border border-gray-200 text-gray-700 hover:border-neutral-300"
                    )}
                  >
                    {page}
                  </button>
                );
              }
              if ((page === 2 && pagination.page > 3) || (page === pagination.pages - 1 && pagination.page < pagination.pages - 2)) {
                return <span key={page} className="text-gray-400 px-1">…</span>;
              }
              return null;
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-neutral-800 hover:border-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
