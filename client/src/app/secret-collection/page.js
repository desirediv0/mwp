"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import SecretProductCard from "@/components/products/SecretProductCard";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconMoodEmpty,
  IconLock,
  IconSparkles,
} from "@tabler/icons-react";

/* ─── Skeleton ──────────────────────────────────────────── */
const ProductCardSkeleton = () => (
  <div className="overflow-hidden animate-pulse bg-white border border-line">
    <div className="aspect-[4/5] w-full bg-ivory-deep" />
    <div className="p-7 space-y-3">
      <div className="h-3 bg-ivory-deep rounded w-1/3" />
      <div className="h-4 bg-ivory-deep rounded w-2/3" />
      <div className="h-3 bg-ivory-deep rounded w-1/2" />
    </div>
  </div>
);

/* ─── Locked Landing ────────────────────────────────────── */
const LockedLanding = () => (
  <div className="min-h-screen bg-white">

    {/* Hero */}
    <section className="relative py-20 md:py-28 overflow-hidden bg-noir luxe-grain luxe-aurora">
      <span
        className="pointer-events-none select-none absolute -bottom-10 left-1/2 -translate-x-1/2 font-display italic whitespace-nowrap text-[9rem] leading-none text-hollow opacity-40 hidden lg:block"
        aria-hidden="true"
      >
        Exclusive
      </span>
      <div className="relative z-10 max-w-7xl mx-auto px-5 text-center">
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 mb-7">
          <Link href="/" className="hover:text-gold-light transition-colors">Home</Link>
          <span className="text-gold">·</span>
          <span className="text-white/80">Secret Collection</span>
        </div>
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm">
          <IconLock className="h-3.5 w-3.5 text-gold" stroke={1.5} />
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
            Members Only
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-ivory mb-6 tracking-tight">
          The <em className="luxe-italic text-gradient-light">Secret</em> Collection
        </h1>
        <span className="mx-auto block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
        <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base font-light leading-relaxed">
          Exclusive access reserved for members of MWP SUPPLEMENTS.
          <br className="hidden sm:block" />
          Discover rare fragrances crafted for those who appreciate timeless luxury.
        </p>
      </div>
    </section>

    {/* Access Gate */}
    <section className="relative -mt-16 z-10 max-w-5xl mx-auto px-5">
      <div className="bg-white border border-line shadow-[0_30px_80px_-25px_rgba(0,0,0,0.1)]">
        <div className="grid lg:grid-cols-2">

          {/* Left — Image */}
          <div className="relative aspect-[4/5] lg:aspect-auto overflow-hidden bg-ivory">
            <img
              src="/secret-access.jpg"
              alt="Secret Collection"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-noir/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-noir/70 backdrop-blur-md text-white text-[9px] uppercase tracking-[0.25em]">
                <IconSparkles className="h-3 w-3 text-gold" stroke={1.5} />
                Invitation Only
              </div>
            </div>
          </div>

          {/* Right — CTA */}
          <div className="flex items-center justify-center p-10 md:p-14 lg:p-16">
            <div className="text-center lg:text-left max-w-sm">
              <span className="luxe-eyebrow block mb-4">Private Access</span>
              <h2 className="font-display text-3xl md:text-4xl text-noir tracking-tight mb-4">
                Enter the <em className="luxe-italic">Inner Circle</em>
              </h2>
              <span className="block h-px w-16 bg-gradient-to-r from-gold to-transparent mb-6 mx-auto lg:mx-0" />
              <p className="text-stone text-[13px] font-light leading-relaxed mb-10">
                This exclusive collection is reserved for registered members.
                Sign in or create an account to discover our rare and
                limited-edition fragrances.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth?redirect=/secret-collection"
                  className="btn-luxe"
                >
                  Sign In <IconArrowRight className="h-4 w-4" stroke={1.5} />
                </Link>
                <Link
                  href="/auth?tab=register&redirect=/secret-collection"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-line text-noir text-[11px] uppercase font-medium tracking-[0.15em] hover:border-gold hover:text-gold transition-all duration-500"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* Bottom spacer */}
    <div className="h-24 md:h-32" />
  </div>
);

/* ─── Main Page ─────────────────────────────────────────── */
export default function SecretCollectionPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSecretAccess, setHasSecretAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const limit = 12;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setCheckingAccess(false);
      return;
    }
    const checkAccess = async () => {
      try {
        const res = await fetchApi("/secret-access/check");
        setHasSecretAccess(res.data?.hasAccess || false);
      } catch {
        setHasSecretAccess(false);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [authLoading, isAuthenticated]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchApi(
        `/public/secret-products?page=${page}&limit=${limit}`
      );
      setProducts(res.data?.products || []);
      setPagination(res.data?.pagination || null);
    } catch (err) {
      if (err.message?.includes("401") || err.message?.toLowerCase()?.includes("authentication")) {
        router.replace("/auth?redirect=/secret-collection");
        return;
      }
      setError(err.message || "Failed to load secret collection");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || checkingAccess) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    if (hasSecretAccess) {
      fetchProducts(1);
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, hasSecretAccess, checkingAccess]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showPagination = pagination && pagination.pages > 1;

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LockedLanding />;
  }

  if (!hasSecretAccess) {
    return (
      <div className="min-h-screen bg-white">
        <section className="relative py-20 md:py-28 overflow-hidden bg-noir luxe-grain luxe-aurora">
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center">
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm">
              <IconLock className="h-3.5 w-3.5 text-gold" stroke={1.5} />
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">Invitation Required</span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-ivory mb-6 tracking-tight">
              The <em className="luxe-italic text-gradient-light">Secret</em> Collection
            </h1>
            <span className="mx-auto block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
            <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base font-light leading-relaxed">
              This collection is available only to invited clients. Please check your email for an access link, or contact support.
            </p>
          </div>
        </section>
        <div className="max-w-md mx-auto px-5 py-16 text-center">
          <div className="bg-ivory border border-line p-10">
            <IconLock className="h-12 w-12 text-gold mx-auto mb-6" stroke={1} />
            <h2 className="font-display text-2xl text-noir mb-3">Access Required</h2>
            <p className="text-stone text-sm mb-8 leading-relaxed">
              You need a personal invitation to access the Secret Collection. Check your email for an activation link.
            </p>
            <div className="space-y-3">
              <Link href="/auth" className="block w-full py-3 bg-noir text-white font-display text-sm tracking-wide hover:bg-noir/90 transition-colors">
                Sign In
              </Link>
              <Link href="/auth?tab=register" className="block w-full py-3 border border-noir text-noir font-display text-sm tracking-wide hover:bg-noir hover:text-white transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-noir luxe-grain luxe-aurora">
        <span
          className="pointer-events-none select-none absolute -bottom-10 left-1/2 -translate-x-1/2 font-display italic whitespace-nowrap text-[9rem] leading-none text-hollow opacity-40 hidden lg:block"
          aria-hidden="true"
        >
          Exclusive
        </span>
        <div className="relative z-10 max-w-7xl mx-auto px-5 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 mb-7">
            <Link href="/" className="hover:text-gold-light transition-colors">Home</Link>
            <span className="text-gold">·</span>
            <span className="text-white/80">Secret Collection</span>
          </div>
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 border border-white/10 bg-white/5 backdrop-blur-sm">
              <IconLock className="h-3.5 w-3.5 text-gold" stroke={1.5} />
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
                Private Access
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-ivory mb-6 tracking-tight">
              The <em className="luxe-italic text-gradient-light">Secret</em> Collection
            </h1>
            <span className="mx-auto block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent mb-6" />
            <p className="text-white/50 max-w-lg mx-auto text-sm md:text-base font-light leading-relaxed">
              An exclusive curation of rare and limited-edition fragrances,
              reserved for those who seek the extraordinary.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-5 mt-8">
          <div className="bg-ivory border border-brand-error/30 p-5 flex items-start gap-3">
            <IconMoodEmpty className="text-brand-error flex-shrink-0 w-5 h-5 mt-0.5" stroke={1.5} />
            <div>
              <h3 className="font-display text-lg text-noir mb-1">Error Loading Collection</h3>
              <p className="text-stone text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-5 py-14 md:py-20">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-ivory border border-line">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-line bg-white">
              <IconLock className="w-7 h-7 text-gold-dark" stroke={1.2} />
            </div>
            <h2 className="font-display text-3xl text-noir mb-3">No Secret Products Yet</h2>
            <p className="text-stone mb-10 max-w-sm mx-auto text-sm font-light">
              The secret collection is being curated. Check back soon for exclusive releases.
            </p>
            <Link href="/products" className="btn-luxe">
              Browse All Products <IconArrowRight className="h-4 w-4" stroke={1.5} />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {products.map((product) => (
                <SecretProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {showPagination && (
              <div className="flex justify-center items-center mt-14 gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-11 h-11 flex items-center justify-center border border-line bg-white text-noir hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <IconChevronLeft className="h-4 w-4" stroke={1.5} />
                </button>

                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-11 h-11 flex items-center justify-center text-sm font-medium transition-all duration-300 ${currentPage === page
                          ? "bg-noir text-white border border-noir"
                          : "bg-white text-noir border border-line hover:border-gold hover:text-gold"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === pagination.pages - 1 && currentPage < pagination.pages - 2)
                  ) {
                    return (
                      <span key={page} className="text-stone px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="w-11 h-11 flex items-center justify-center border border-line bg-white text-noir hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <IconChevronRight className="h-4 w-4" stroke={1.5} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
