"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import Reveal from "@/components/ui/Reveal";
import { IconArrowRight } from "@tabler/icons-react";

const FALLBACK_POSTS = [
  {
    id: 1,
    title: "The Art of Layering Fragrances",
    slug: "art-of-layering-fragrances",
    summary: "Master the technique of combining scents to create your signature aroma.",
    coverImage: "/journal-1.jpg",
  },
  {
    id: 2,
    title: "Understanding Fragrance Notes",
    slug: "understanding-fragrance-notes",
    summary: "A guide to top, heart, and base notes — the building blocks of every perfume.",
    coverImage: "/journal-2.jpg",
  },
];

export default function JournalSection() {
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetchApi("/content/blog?limit=2");
        const blogPosts = res?.data?.posts;
        if (Array.isArray(blogPosts) && blogPosts.length > 0) {
          setPosts(blogPosts.slice(0, 2));
        }
      } catch (err) {
        // keep fallback
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section className="py-14 md:py-16  bg-ivory overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        {/* Section Header */}
        <Reveal>
          <div className="text-center mb-14 md:mb-18">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-4">Journal</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] text-noir tracking-tight leading-tight">
              Notes from <em className="italic text-gold-dark">the Maison</em>
            </h2>
            <p className="text-[14px] md:text-[15px] text-stone mt-4 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
              Fragrance stories, seasonal notes and insights that bring our collections to life — written for those who wear their scent with intent.
            </p>
          </div>
        </Reveal>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {posts.map((post, index) => (
            <Reveal key={post.id || index} delay={index * 0.1}>
              <Link href={`/blog/${post.slug}`} className="block group">
                <div
                  className="overflow-hidden bg-white border border-line group-hover:border-gold/30 transition-all duration-500"
                  style={{ borderRadius: "8px" }}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.coverImage || (index === 0 ? "/journal-1.jpg" : "/journal-2.jpg")}
                      alt={post.title || "Journal"}
                      fill
                      className="object-cover transition-transform ease-out group-hover:scale-105"
                      style={{ transitionDuration: "1400ms" }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" }}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-7 md:p-8">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-gold font-medium block mb-3">
                      {index === 0 ? "Latest Story" : "From the Journal"}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl text-noir tracking-tight mb-3 group-hover:text-gold-dark transition-colors duration-300">
                      {post.title}
                    </h3>
                    <p className="text-[13px] text-stone leading-relaxed font-light mb-5">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-2 text-noir group-hover:text-gold transition-colors duration-300">
                      <span className="text-[11px] uppercase tracking-[0.15em] font-medium">Read More</span>
                      <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" stroke={1.5} />
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {/* View All */}
        <Reveal>
          <div className="text-center mt-12 md:mt-16">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2.5 border border-line text-noir px-8 py-4 text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gold hover:text-gold transition-colors duration-500"
              style={{ borderRadius: "8px" }}
            >
              Read the Journal
              <IconArrowRight className="h-4 w-4" stroke={1.5} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
