"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, cn } from "@/lib/utils";
import { IconSearch, IconFlask2, IconArrowRight, IconLeaf } from "@tabler/icons-react";

const img = (raw) => {
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

function IngredientCard({ ing }) {
  const src = img(ing.image);
  return (
    <div className="group rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-red-300 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.18)]">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {src ? (
          <Image
            src={src}
            alt={ing.name}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-300">
            <IconLeaf className="h-10 w-10" stroke={1.5} />
            <span className="mt-2 text-[10px] uppercase tracking-widest font-bold">Image coming soon</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[14px] font-bold text-gray-900 leading-snug">{ing.name}</h3>
        <p className="text-[12.5px] text-gray-500 leading-relaxed mt-1.5">{ing.benefit}</p>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-200">
      <div className="aspect-square w-full bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchApi("/ingredients")
      .then((r) => setIngredients(r?.data?.ingredients || []))
      .catch(() => setIngredients([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return ingredients;
    return ingredients.filter(
      (i) => i.name.toLowerCase().includes(term) || i.benefit.toLowerCase().includes(term)
    );
  }, [q, ingredients]);

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
            <span className="text-white/80">Ingredients</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <IconFlask2 className="h-3.5 w-3.5" /> {ingredients.length || 32} Actives
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Our <span className="text-red-500">Ingredients</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-[14px] md:text-base leading-relaxed">
            Every MWP formula is built on standardized, research-backed actives. Here&apos;s what
            each one does — in plain language.
          </p>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-10 md:pt-12 pb-6">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" stroke={2} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ingredients or benefits…"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pb-16 md:pb-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
              <IconFlask2 className="w-8 h-8 text-red-500" stroke={1.5} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">
              {ingredients.length === 0 ? "Coming Soon" : `No match for "${q}"`}
            </h2>
            <p className="text-gray-500 text-[14px] max-w-sm mx-auto">
              {ingredients.length === 0
                ? "Our full ingredient library is being finalised. Check back shortly."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((ing) => <IngredientCard key={ing.id} ing={ing} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-2xl bg-[#0A0A0A] text-white p-8 md:p-10 text-center">
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            See these actives <span className="text-red-500">in action</span>
          </h3>
          <p className="text-white/60 text-[14px] mt-2 max-w-lg mx-auto">
            Explore the 6 flagship MWP formulations built on these clinically dosed ingredients.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-[12px] uppercase tracking-wider font-bold hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/25 transition-all"
          >
            Shop Products <IconArrowRight className="h-4 w-4" stroke={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}
