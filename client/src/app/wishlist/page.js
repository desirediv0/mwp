"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../account/settings.css";
import { ClientOnly } from "@/components/client-only";
import { fetchApi } from "@/lib/utils";
import { ProductCard } from "@/components/products/ProductCard";
import {
  IconHeart,
  IconTrash,
  IconChevronLeft,
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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FAF8F2]">
        <IconLoader2 className="h-6 w-6 animate-spin text-[#A8741F]" stroke={1.5} />
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="mwp-set-page">
        <div className="mwp-set" style={{ maxWidth: 1100 }}>
          <header className="mwp-set-top">
            <Link href="/account" className="mwp-set-back" aria-label="Back to settings"><IconChevronLeft size={20} stroke={1.8} /></Link>
            <h1 className="mwp-set-title">Wishlist{!loadingItems && wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ""}</h1>
          </header>

          {error && <p className="mwp-alert" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

          {loadingItems ? (
            <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>
          ) : wishlistItems.length === 0 ? (
            <div className="mwp-empty">
              <IconHeart size={34} stroke={1.3} />
              <h3>Nothing saved yet</h3>
              <p>Tap the heart on any formula to save it here for later.</p>
              <Link href="/products" className="mwp-btn">Browse formulas</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {wishlistItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ProductCard product={{ ...item, id: item.productId }} />
                  <button
                    onClick={(e) => { e.preventDefault(); removeFromWishlist(item.id); }}
                    className="absolute left-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-full border border-[#E6DFC9] bg-white/95 text-[#4A5470] shadow-sm transition-colors hover:text-[#B3001B]"
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <IconTrash size={16} stroke={1.5} />
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
