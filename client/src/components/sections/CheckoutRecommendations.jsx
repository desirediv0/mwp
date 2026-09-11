"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { IconPlus, IconCheck } from "@tabler/icons-react";

const getImageUrl = (img) => {
  if (!img) return "/placeholder.jpg";
  if (typeof img !== "string") return "/placeholder.jpg";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  const clean = img.startsWith("/") ? img.slice(1) : img;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${clean}`;
};

/**
 * "You may also like" strip driven by the admin-curated Checkout Recommendations list.
 * Used on the cart and checkout pages. Renders nothing if the admin hasn't set any.
 */
export default function CheckoutRecommendations({ title = "You May Also Like" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const { addToCart, cart } = useCart();

  useEffect(() => {
    let cancelled = false;
    fetchApi("/public/checkout-recommendations")
      .then((res) => {
        if (cancelled) return;
        setItems(res?.data?.products || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cartVariantIds = new Set(
    (cart?.items || []).map((i) => i?.variant?.id).filter(Boolean)
  );

  const handleAdd = async (product) => {
    if (!product.variantId || !product.inStock) return;
    setAddingId(product.id);
    try {
      await addToCart(product.variantId, 1);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2500);
    } catch (e) {
      // cart-context already shows an error toast
      console.error(e);
    } finally {
      setAddingId(null);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-white border border-black/5 rounded-lg p-5 sm:p-6">
      <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium mb-5 pb-4 border-b border-black/5">
        {title}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {items.map((p) => {
          const inCart = p.variantId && cartVariantIds.has(p.variantId);
          const busy = addingId === p.id;
          const justAdded = addedId === p.id;
          return (
            <div
              key={p.id}
              className="border border-black/5 rounded-lg overflow-hidden flex flex-col"
            >
              <Link
                href={`/products/${p.slug}`}
                className="relative block aspect-square bg-ivory"
              >
                <Image
                  src={getImageUrl(p.image)}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 45vw, 20vw"
                />
                {!p.inStock && (
                  <span className="absolute top-2 left-2 bg-black text-white text-[8px] uppercase tracking-[0.15em] px-2 py-1 rounded">
                    Sold Out
                  </span>
                )}
              </Link>

              <div className="p-2.5 flex flex-col flex-1">
                <Link
                  href={`/products/${p.slug}`}
                  className="text-[11px] leading-tight text-black line-clamp-2 hover:text-gold-dark transition-colors"
                >
                  {p.name}
                </Link>

                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[12px] font-semibold text-black">
                    {formatCurrency(p.basePrice)}
                  </span>
                  {p.hasSale && p.regularPrice > p.basePrice && (
                    <span className="text-[10px] text-black/40 line-through">
                      {formatCurrency(p.regularPrice)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAdd(p)}
                  disabled={!p.inStock || !p.variantId || busy || inCart}
                  className="mt-2 flex items-center justify-center gap-1.5 py-2 text-[9px] uppercase tracking-[0.18em] font-semibold border border-black/15 rounded-md text-black hover:bg-black hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
                >
                  {inCart || justAdded ? (
                    <>
                      <IconCheck className="h-3 w-3" /> Added
                    </>
                  ) : busy ? (
                    "Adding…"
                  ) : !p.inStock ? (
                    "Sold Out"
                  ) : (
                    <>
                      <IconPlus className="h-3 w-3" /> Add to Bag
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
