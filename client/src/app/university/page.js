"use client";

import Link from "next/link";
import { IconBook2, IconLeaf, IconFlame, IconHeart, IconSun } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { useEffect, useState } from "react";

const CATEGORIES = [
  { slug: "mens-wellness", label: "Men's Wellness", Icon: IconFlame },
  { slug: "womens-wellness", label: "Women's Wellness", Icon: IconHeart },
  { slug: "ingredients", label: "Ingredients", Icon: IconLeaf },
  { slug: "energy", label: "Energy", Icon: IconSun },
  { slug: "healthy-lifestyle", label: "Healthy Lifestyle", Icon: IconBook2 },
];

export default function MwpUniversityPage() {
  const [posts, setPosts] = useState([]);
  const [cats, setCats] = useState([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchApi("/content/blog?limit=24").catch(() => null),
      fetchApi("/content/blog-categories").catch(() => null),
    ])
      .then(([postsRes, catsRes]) => {
        setPosts(postsRes?.data?.posts || []);
        const apiCats = Array.isArray(catsRes?.data)
          ? catsRes.data
          : catsRes?.data?.categories || [];
        setCats(apiCats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (active === "all") return;
    let alive = true;
    setLoading(true);
    fetchApi(`/content/blog?limit=24&category=${active}`)
      .then((res) => {
        if (alive) setPosts(res?.data?.posts || []);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [active]);

  const filterCats = cats.length
    ? cats.map((c) => ({ slug: c.slug, label: c.name }))
    : CATEGORIES;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#121216] via-[#0A0A0A] to-[#09090b]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[280px] bg-red-600/15 blur-[140px] rounded-full" />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-16 md:py-24">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white/80">MWP University</span>
          </nav>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 mb-4">
            Education · Ingredients · Lifestyle
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            MWP <span className="text-red-500">University</span>
          </h1>
          <p className="text-white/60 max-w-2xl text-sm md:text-base leading-relaxed">
            Clear, science-backed articles on men&apos;s wellness, women&apos;s wellness,
            ingredients, energy and healthy living — so every formula choice is informed.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-10 md:py-14">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            type="button"
            onClick={() => setActive("all")}
            className={
              active === "all"
                ? "px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white text-black"
                : "px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-white/15 text-white/70 hover:text-white hover:border-white/40"
            }
          >
            All
          </button>
          {filterCats.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setActive(c.slug)}
              className={
                active === c.slug
                  ? "px-4 py-2 text-[11px] font-bold uppercase tracking-wider bg-white text-black"
                  : "px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-white/15 text-white/70 hover:text-white hover:border-white/40"
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 animate-pulse">
                <div className="aspect-video bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="h-3 w-full bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/15 rounded-xl">
            <IconBook2 className="h-10 w-10 mx-auto text-white/30 mb-4" />
            <p className="text-white/60 text-sm">No articles published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/university/${post.slug}`}
                className="group rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-video bg-gradient-to-br from-[#141416] to-[#0A0A0A] overflow-hidden">
                  {post.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <IconBook2 className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(post.categories || []).map((c) => (
                      <span
                        key={c.id}
                        className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-red-600/15 border border-red-500/25 text-red-400"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-bold text-[15px] leading-snug group-hover:text-red-400 transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.summary && (
                    <p className="text-[13px] text-white/55 leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
