"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import {
  IconFlask2,
  IconLeaf,
  IconArrowRight,
  IconShoppingBag,
  IconMapPin,
  IconShieldCheck,
  IconCertificate,
} from "@tabler/icons-react";

const img = (raw) => {
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

function IngredientCard({ ing, index }) {
  const src = img(ing.image);
  return (
    <div className="group rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:border-red-300 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.18)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {src ? (
          <Image
            src={src}
            alt={ing.name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-300">
            <IconLeaf className="h-10 w-10" stroke={1.5} />
            <span className="mt-2 text-[10px] uppercase tracking-widest font-bold">No image yet</span>
          </div>
        )}
        <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-extrabold flex items-center justify-center">
          {index + 1}
        </span>
        {ing.keyBenefit && (
          <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold text-white bg-red-600 px-2.5 py-1 rounded-full shadow-sm">
            {ing.keyBenefit}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="text-[16px] font-extrabold text-gray-900 leading-snug">{ing.name}</h3>
          {ing.type && (
            <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              {ing.type}
            </span>
          )}
        </div>
        {ing.scientificName && (
          <p className="text-[12px] italic text-gray-400 mt-0.5">{ing.scientificName}</p>
        )}
        <p className="text-[13.5px] text-gray-600 leading-relaxed mt-2.5">{ing.description}</p>
        {ing.source && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[11.5px] text-gray-500">
            <IconMapPin className="h-3.5 w-3.5 text-red-500 shrink-0" stroke={2} />
            <span>{ing.source}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-200">
      <div className="aspect-[4/3] w-full bg-gray-100" />
      <div className="p-4 sm:p-5 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function ProductIngredientsPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchApi(`/ingredients/product/${productId}`)
      .then((r) => {
        setProduct(r?.data?.product || null);
        setIngredients(r?.data?.ingredients || []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [productId]);

  if (notFound) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <IconFlask2 className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-[14px] text-gray-500 mb-6">
            This product page is no longer available.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white text-[12px] uppercase tracking-wider font-bold hover:bg-red-700 transition-colors"
          >
            Browse Products <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const productImg = product ? img(product.image) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero — big product image + info */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[340px] bg-red-600/20 blur-[150px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 lg:px-10 py-14 md:py-20">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/40 mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/ingredients" className="hover:text-white transition-colors">Ingredients</Link>
            <span>/</span>
            <span className="text-white/80 truncate max-w-[160px]">{product?.name || "…"}</span>
          </nav>

          {loading ? (
            <div className="grid md:grid-cols-[240px_1fr] gap-8 items-center animate-pulse">
              <div className="w-full aspect-square rounded-3xl bg-white/10" />
              <div className="space-y-3">
                <div className="h-3 w-32 bg-white/10 rounded" />
                <div className="h-10 w-2/3 bg-white/10 rounded" />
                <div className="h-4 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-10 items-center">
              {/* Big product image */}
              <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-60 md:h-60 mx-auto md:mx-0 rounded-3xl overflow-hidden bg-white shadow-2xl shadow-black/40 border border-white/10">
                {productImg ? (
                  <Image
                    src={productImg}
                    alt={product.name}
                    fill
                    sizes="240px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                    <IconFlask2 className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="min-w-0 text-center md:text-left">
                {product?.category && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-red-400 bg-red-600/10 border border-red-500/20 px-3 py-1 rounded-full mb-3">
                    <IconCertificate className="h-3.5 w-3.5" /> {product.category}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05]">
                  {product?.name}
                </h1>
                <p className="text-white/50 text-[13px] sm:text-sm mt-3 max-w-lg mx-auto md:mx-0">
                  Full ingredient transparency — every active in this formula, its source, and
                  what it does for you.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5">
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white/80">
                    <IconFlask2 className="h-4 w-4 text-red-500" />
                    {ingredients.length} ingredient{ingredients.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white/80">
                    <IconShieldCheck className="h-4 w-4 text-emerald-500" />
                    Lab verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Ingredients grid */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 lg:px-10 py-12 md:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="h-px w-8 bg-red-500/50" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold">
              Full Transparency
            </span>
            <span className="h-px w-8 bg-red-500/50" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            What&apos;s Inside This <span className="text-red-600">Formula</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <IconFlask2 className="h-9 w-9 text-red-500 mx-auto mb-4" stroke={1.5} />
            <h3 className="text-lg font-extrabold text-gray-900 mb-1.5">Coming Soon</h3>
            <p className="text-gray-500 text-[13.5px] max-w-xs mx-auto">
              The ingredient list for this product is being finalised.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ingredients.map((ing, i) => (
              <IngredientCard key={ing.id} ing={ing} index={i} />
            ))}
          </div>
        )}

        {/* Buy / view actions */}
        {product?.slug && (
          <div className="mt-14 rounded-2xl bg-[#0A0A0A] text-white p-7 sm:p-10 text-center">
            <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-white/10 border border-white/10 mb-5">
              {productImg ? (
                <Image src={productImg} alt={product.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <IconFlask2 className="h-6 w-6" />
                </div>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">{product.name}</h3>
            <p className="text-white/50 text-[13px] mt-2 max-w-md mx-auto">
              Ready to experience these clinically dosed actives yourself?
            </p>
            <Link
              href={`/products/${product.slug}`}
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-[12px] uppercase tracking-wider font-bold hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/25 transition-all"
            >
              <IconShoppingBag className="h-4 w-4" /> Buy Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
