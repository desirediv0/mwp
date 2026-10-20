import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchApi, formatDate } from "@/lib/utils";
import { SITE_NAME, absoluteUrl, jsonLd } from "@/lib/seo";
import { IconArrowLeft, IconBook2 } from "@tabler/icons-react";

export const revalidate = 300;

const getPost = cache(async (slug) => {
  try {
    const res = await fetchApi(`/content/blog/${slug}`);
    return res?.data?.post ? { post: res.data.post, related: res.data.relatedPosts || [] } : null;
  } catch {
    return null;
  }
});

const plain = (html = "") => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }) {
  const data = await getPost(params.slug);
  if (!data) return { title: "Article not found", robots: { index: false } };
  const { post } = data;
  const title = post.metaTitle || post.title;
  const description = (post.metaDescription || post.summary || plain(post.content)).slice(0, 160);
  const url = absoluteUrl(`/university/${post.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: SITE_NAME, publishedTime: post.createdAt, images: post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.title }] : [] },
    twitter: { card: "summary_large_image", title, description, images: post.coverImageUrl ? [post.coverImageUrl] : [] },
  };
}

export default async function UniversityPostPage({ params }) {
  const data = await getPost(params.slug);
  if (!data) notFound();
  const { post, related } = data;
  const url = absoluteUrl(`/university/${post.slug}`);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: (post.summary || plain(post.content)).slice(0, 200),
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: { "@type": post.author?.firstName ? "Person" : "Organization", name: post.author?.firstName ? `${post.author.firstName} ${post.author.lastName || ""}`.trim() : "MWP Supplements" },
    publisher: { "@type": "Organization", name: "MWP Supplements LLC", logo: { "@type": "ImageObject", url: absoluteUrl("/mwp-logo.png") } },
    mainEntityOfPage: url,
  };
  const crumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "MWP University", item: absoluteUrl("/university") },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main className="mwp-page pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbLd) }} />
      <section className="border-b border-neutral-200 bg-white">
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 pt-12 pb-10">
          <Link href="/university" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6">
            <IconArrowLeft className="h-4 w-4" /> MWP University
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {(post.categories || []).map((c) => (
              <span key={c.id} className="text-xs px-3 py-1 bg-white border border-neutral-200 text-neutral-700 rounded-full">{c.name}</span>
            ))}
          </div>
          <h1 className="mwp-title mb-4">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            {post.author?.firstName && (<><span>{post.author.firstName} {post.author.lastName || ""}</span><span>·</span></>)}
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-5 md:px-8 pt-10">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.title} className="w-full aspect-video object-cover rounded-2xl border border-neutral-200 mb-8" />
        )}
        <div className="mwp-rich-text" dangerouslySetInnerHTML={{ __html: post.content }} />
        <p className="mt-10 text-[12px] leading-relaxed text-neutral-500">
          * These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
        </p>
      </article>

      {related.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 md:px-8 mt-16 pt-10 border-t border-neutral-200">
          <h2 className="mwp-heading mb-6 flex items-center gap-2"><IconBook2 className="h-5 w-5 text-neutral-500" /> More to read</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/university/${r.slug}`} className="group p-5 rounded-2xl bg-white border border-[#e6ded2] hover:border-neutral-900 transition-colors">
                <h3 className="text-base font-medium group-hover:underline transition-colors line-clamp-3">{r.title}</h3>
                <p className="text-[12px] text-neutral-500 mt-2">{formatDate(r.createdAt)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
