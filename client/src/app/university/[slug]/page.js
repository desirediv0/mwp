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
      <main className="mwp-page flex min-h-[50vh] items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="mwp-page flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5">
        <p className="text-neutral-600">{error || "Article not found"}</p>
        <Link href="/university" className="mwp-text-link">
          Back to MWP University
        </Link>
      </main>
    );
  }

  return (
    <main className="mwp-page pb-20">
      <section className="border-b border-neutral-200 bg-[#f6f6f3]">
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 pt-12 pb-10">
          <Link
            href="/university"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <IconArrowLeft className="h-4 w-4" /> MWP University
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.categories || []).map((c) => (
              <span
                key={c.id}
                className="text-xs px-3 py-1 bg-white border border-neutral-200 text-neutral-700 rounded-full"
              >
                {c.name}
              </span>
            ))}
          </div>
          <h1 className="mwp-title mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
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
            className="w-full aspect-video object-cover rounded-2xl border border-neutral-200 mb-8"
          />
        )}
        <div
          className="mwp-rich-text"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 md:px-8 mt-16 pt-10 border-t border-neutral-200">
          <h2 className="mwp-heading mb-6 flex items-center gap-2">
            <IconBook2 className="h-5 w-5 text-neutral-500" /> More to read
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/university/${r.slug}`}
                className="group p-5 rounded-2xl bg-[#f6f6f3] border border-neutral-200 hover:border-neutral-900 transition-colors"
              >
                <h3 className="text-base font-medium group-hover:underline transition-colors line-clamp-3">
                  {r.title}
                </h3>
                <p className="text-[12px] text-neutral-500 mt-2">{formatDate(r.createdAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
