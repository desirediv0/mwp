"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchApi, formatDate } from "@/lib/utils";
import { IconArrowLeft, IconBook2, IconLoader2 } from "@tabler/icons-react";

export default function UniversityPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchApi(`/content/blog/${slug}`)
      .then((res) => {
        setPost(res?.data?.post || null);
        setRelated(res?.data?.relatedPosts || []);
      })
      .catch(() => setError("Article not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <IconLoader2 className="h-8 w-8 animate-spin text-white/50" />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-white/60">{error || "Article not found"}</p>
        <Link href="/university" className="text-red-400 text-sm font-bold uppercase tracking-wider">
          Back to MWP University
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white pb-20">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#121216] to-[#09090b]" />
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 pt-12 pb-10">
          <Link
            href="/university"
            className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/50 hover:text-white mb-6"
          >
            <IconArrowLeft className="h-4 w-4" /> MWP University
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.categories || []).map((c) => (
              <span
                key={c.id}
                className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 bg-red-600/15 border border-red-500/25 text-red-400"
              >
                {c.name}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-[12px] text-white/45">
            {post.author?.firstName && (
              <span>
                {post.author.firstName} {post.author.lastName || ""}
              </span>
            )}
            <span>·</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-5 md:px-8 pt-10">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full aspect-video object-cover rounded-xl border border-white/10 mb-8"
          />
        )}
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-white/75 prose-a:text-red-400 prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 md:px-8 mt-16 pt-10 border-t border-white/10">
          <h2 className="text-lg font-extrabold uppercase tracking-wider mb-6 flex items-center gap-2">
            <IconBook2 className="h-5 w-5 text-red-500" /> Related Articles
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/university/${r.slug}`}
                className="group p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-colors"
              >
                <h3 className="text-sm font-bold group-hover:text-red-400 transition-colors line-clamp-3">
                  {r.title}
                </h3>
                <p className="text-[12px] text-white/45 mt-2">{formatDate(r.createdAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
