import { redirect } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import UniversityClient from "./UniversityClient";
import { universityHref } from "@/lib/university-links";

export const revalidate = 300;

const PAGE_SIZE = 12;

const toPage = (v) => {
  const n = parseInt(Array.isArray(v) ? v[0] : v, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : 1;
};
const toCategory = (v) => {
  const s = String(Array.isArray(v) ? v[0] : v || "").toLowerCase();
  return /^[a-z0-9-]{1,60}$/.test(s) ? s : "all";
};

const hrefFor = (category, page) => universityHref(category, page).replace(/#articles$/, "");

export async function generateMetadata({ searchParams }) {
  const page = toPage(searchParams?.page);
  const category = toCategory(searchParams?.category);
  const suffix = page > 1 ? ` (Page ${page})` : "";
  const title = `MWP University: Supplement Guides & Articles${suffix}`;
  const description = "Learn how supplements work with clear, practical guides from MWP Supplements: ingredients, routines and everyday wellness.";
  const canonical = absoluteUrl(hrefFor(category, page));
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
  };
}

async function load(path) {
  try {
    return await fetchApi(path);
  } catch {
    return null;
  }
}

export default async function UniversityPage({ searchParams }) {
  const page = toPage(searchParams?.page);
  const category = toCategory(searchParams?.category);

  const query = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
  if (category !== "all") query.set("category", category);

  const [postsRes, catsRes] = await Promise.all([load(`/content/blog?${query}`), load("/content/blog-categories")]);
  const failed = !postsRes;
  const posts = postsRes?.data?.posts || [];
  const pagination = postsRes?.data?.pagination || {};
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const totalPosts = pagination.totalPosts || 0;
  const categories = (Array.isArray(catsRes?.data) ? catsRes.data : catsRes?.data?.categories || []).filter((c) => (c.postCount ?? 1) > 0);

  // A page number past the end (an old or mistyped link) goes to the last real page
  if (!failed && page > totalPages) redirect(hrefFor(category, totalPages));

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MWP University",
    url: absoluteUrl(hrefFor(category, page)),
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absoluteUrl(`/university/${p.slug}`), datePublished: p.createdAt })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(blogLd) }} />
      <UniversityClient posts={posts} categories={categories} activeCategory={category} page={page} totalPages={totalPages} totalPosts={totalPosts} failed={failed} />
    </>
  );
}
