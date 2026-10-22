import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchApi, formatDate } from "@/lib/utils";
import { SITE_NAME, absoluteUrl, jsonLd, plainText } from "@/lib/seo";
import { IconArrowLeft, IconArrowRight, IconBook2, IconClock, IconUser, IconShieldCheck, IconCalendar, IconChevronDown, IconHelp } from "@tabler/icons-react";
import "./article.css";

export const revalidate = 300;

const getPost = cache(async (slug) => {
  try {
    const res = await fetchApi(`/content/blog/${slug}`);
    return res?.data?.post ? { post: res.data.post, related: res.data.relatedPosts || [] } : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }) {
  const data = await getPost(params.slug);
  if (!data) return { title: "Article not found", robots: { index: false } };
  const { post } = data;
  const title = post.metaTitle || post.title;
  const description = (post.metaDescription || post.summary || plainText(post.content)).slice(0, 160);
  const url = absoluteUrl(`/university/${post.slug}`);
  return {
    title,
    description,
    keywords: post.keywords || undefined,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: SITE_NAME, publishedTime: post.createdAt, modifiedTime: post.updatedAt, images: post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.title }] : [] },
    twitter: { card: "summary_large_image", title, description, images: post.coverImageUrl ? [post.coverImageUrl] : [] },
  };
}

const slugOf = (text) => plainText(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";

// Gives every <h2> an anchor id and returns the list for the table of contents
function withHeadingIds(html = "") {
  const toc = [];
  const used = new Set();
  const out = String(html).replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (m, attrs, inner) => {
    let id = slugOf(inner);
    let n = 2;
    while (used.has(id)) id = `${slugOf(inner)}-${n++}`;
    used.add(id);
    toc.push({ id, text: plainText(inner) });
    return `<h2${attrs.replace(/\sid="[^"]*"/i, "")} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

const asList = (v) => (Array.isArray(v) ? v : []);

// Reference lines may contain web addresses: make them clickable
function linkify(text) {
  const parts = String(text).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow">{part}</a>
    ) : (
      part
    )
  );
}

export default async function UniversityPostPage({ params }) {
  const data = await getPost(params.slug);
  if (!data) notFound();
  const { post, related } = data;
  const url = absoluteUrl(`/university/${post.slug}`);
  const { html, toc } = withHeadingIds(post.content);
  const faq = asList(post.faq).filter((f) => f?.question && f?.answer);
  const references = asList(post.references).filter(Boolean);
  const authorName = post.writtenBy || (post.author?.firstName ? `${post.author.firstName} ${post.author.lastName || ""}`.trim() : "MWP Supplements");

  const meta = [
    { Icon: IconUser, label: "Written by", value: authorName },
    post.reviewedBy && { Icon: IconShieldCheck, label: "Reviewed by", value: post.reviewedBy },
    { Icon: IconCalendar, label: "Last updated", value: post.lastUpdatedLabel || formatDate(post.updatedAt || post.createdAt) },
    post.readingMinutes && { Icon: IconClock, label: "Reading time", value: `${post.readingMinutes} min` },
  ].filter(Boolean);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: (post.summary || plainText(post.content)).slice(0, 200),
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: { "@type": "Organization", name: authorName },
    publisher: { "@type": "Organization", name: "MWP Supplements LLC", logo: { "@type": "ImageObject", url: absoluteUrl("/mwp-logo-2.png") } },
    mainEntityOfPage: url,
    ...(post.readingMinutes ? { timeRequired: `PT${post.readingMinutes}M` } : {}),
    ...(references.length ? { citation: references } : {}),
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
  const faqLd = faq.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }
    : null;

  return (
    <main className="mwp-page mwp-article pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(crumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd) }} />}

      <header className="mwp-article-head">
        <div className="mwp-article-wrap">
          <Link href="/university" className="mwp-article-back"><IconArrowLeft size={16} /> MWP University</Link>
          {post.categories?.length > 0 && (
            <div className="mwp-article-cats">{post.categories.map((c) => <span key={c.id}>{c.name}</span>)}</div>
          )}
          <h1>{post.title}</h1>
          {post.summary && <p className="mwp-article-lead">{post.summary}</p>}

          <dl className="mwp-article-meta">
            {meta.map(({ Icon, label, value }) => (
              <div key={label}>
                <dt><Icon size={14} stroke={1.6} /> {label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mwp-article-wrap">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.title} className="mwp-article-cover" />
        )}

        {post.mainQuestion && (
          <aside className="mwp-article-question">
            <IconHelp size={22} stroke={1.5} />
            <div><span>The question this article answers</span><p>{post.mainQuestion}</p></div>
          </aside>
        )}

        {toc.length > 1 && (
          <nav className="mwp-article-toc" aria-label="In this article">
            <p>In this article</p>
            <ol>{toc.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>)}{faq.length > 0 && <li><a href="#faq">Frequently asked questions</a></li>}</ol>
          </nav>
        )}

        <article className="mwp-rich-text mwp-article-body" dangerouslySetInnerHTML={{ __html: html }} />

        {faq.length > 0 && (
          <section id="faq" className="mwp-article-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Frequently asked questions</h2>
            {faq.map((f, i) => (
              <details key={i} open={i === 0}>
                <summary><span>{f.question}</span><IconChevronDown size={18} stroke={1.6} /></summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </section>
        )}

        {references.length > 0 && (
          <section className="mwp-article-refs" aria-labelledby="refs-title">
            <h2 id="refs-title">References</h2>
            <ol>{references.map((r, i) => <li key={i}>{linkify(r)}</li>)}</ol>
          </section>
        )}

        <aside className="mwp-article-disclaimer" role="note">
          <strong>Disclaimer</strong>
          <p>
            {post.disclaimer ||
              "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease. This article is for educational purposes only and is not medical advice."}
          </p>
        </aside>

        {post.ctaText && post.ctaUrl && (
          <div className="mwp-article-cta">
            {post.ctaNote && <p>{post.ctaNote}</p>}
            <Link href={post.ctaUrl} className="mwp-button">{post.ctaText} <IconArrowRight size={17} /></Link>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mwp-article-related">
          <div className="mwp-article-wrap mwp-article-wrap-wide">
            <h2><IconBook2 size={20} stroke={1.5} /> More to read</h2>
            <div className="mwp-article-related-grid">
              {related.map((r) => (
                <Link key={r.id} href={`/university/${r.slug}`}>
                  <h3>{r.title}</h3>
                  <p>{formatDate(r.createdAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
