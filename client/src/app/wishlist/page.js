"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientOnly } from "@/components/client-only";
import { fetchApi } from "@/lib/utils";
import { ProductCard } from "@/components/products/ProductCard";
import {
  IconHeart,
  IconTrash,
  IconShoppingBag,
  IconArrowRight,
  IconLoader2,
} from "@tabler/icons-react";

export default function WishlistPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth?redirect=/wishlist");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingItems(true);
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((res) => setWishlistItems(res.data?.wishlistItems || []))
      .catch(() => setError("Failed to load wishlist. Please try again."))
      .finally(() => setLoadingItems(false));
  }, [isAuthenticated]);

  const removeFromWishlist = async (wishlistItemId) => {
    try {
      await fetchApi(`/users/wishlist/${wishlistItemId}`, { method: "DELETE", credentials: "include" });
      setWishlistItems((cur) => cur.filter((item) => item.id !== wishlistItemId));
      setError("");
    } catch {
      setError("Failed to remove item. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <IconLoader2 className="h-6 w-6 animate-spin text-[#886b40]" stroke={1.5} />
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-white">

        {/* Hero */}
        <section className="relative py-14 md:py-20 overflow-hidden bg-[#f6f2eb] border-b border-[#e6ded2]">
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 mb-7">
              <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
              <span className="text-[#886b40]">/</span>
              <span className="text-neutral-800">Wishlist</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 tracking-tight mb-4">
              My Wishlist
            </h1>
            <span className="mx-auto block h-px w-16 bg-[#886b40] mb-4" />
            {!loadingItems && wishlistItems.length > 0 && (
              <p className="text-neutral-600 text-[13px]">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"} saved
              </p>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-5 py-12 md:py-16">

          {/* Error */}
          {error && (
            <div className="px-5 py-4 bg-red-50 border border-red-200 text-red-700 text-[13px] font-light mb-8">{error}</div>
          )}

          {/* Loading */}
          {loadingItems ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 animate-pulse overflow-hidden">
                  <div className="aspect-[4/5] bg-gray-50" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-50 w-1/3" />
                    <div className="h-4 bg-gray-50 w-2/3" />
                    <div className="h-3 bg-gray-50 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : wishlistItems.length === 0 ? (
            /* Empty State */
            <div className="bg-[#f6f2eb] border border-[#e6ded2] rounded-2xl p-12 md:p-16 text-center max-w-lg mx-auto">
              <IconHeart className="h-8 w-8 text-gray-500 mx-auto mb-4" stroke={1.2} />
              <h3 className="text-2xl text-gray-900 mb-3">Wishlist is Empty</h3>
              <p className="text-gray-500 text-[13px] font-light leading-relaxed mb-8 max-w-xs mx-auto">
                Save your favorite styles for later. Tap the heart icon on any product to save them here.
              </p>
              <Link href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white text-[12px] font-semibold rounded-full hover:bg-neutral-800 transition-colors">
                <IconShoppingBag className="h-4 w-4" stroke={1.5} /> Browse Collection
              </Link>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ProductCard product={{ ...item, id: item.productId }} />
                  <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(item.id); }}
                    className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-neutral-900 shadow-sm border border-[#e6ded2] transition-colors"
                    title="Remove from wishlist"
                  >
                    <IconTrash className="h-3.5 w-3.5" stroke={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClientOnly>
  );
}
