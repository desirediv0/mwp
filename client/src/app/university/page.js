import { fetchApi } from "@/lib/utils";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import UniversityClient from "./UniversityClient";

export const revalidate = 300;

export const metadata = {
  title: "MWP University: Supplement Guides & Articles",
  description: "Learn how supplements work with clear, practical guides from MWP Supplements: ingredients, routines and everyday wellness.",
  alternates: { canonical: "/university" },
  openGraph: { title: "MWP University: Supplement Guides & Articles", description: "Clear, practical supplement guides from MWP Supplements.", url: "/university", type: "website" },
};

async function load(path) {
  try {
    return await fetchApi(path);
  } catch {
    return null;
  }
}

export default async function UniversityPage() {
  const [postsRes, catsRes] = await Promise.all([load("/content/blog?limit=24"), load("/content/blog-categories")]);
  const posts = postsRes?.data?.posts || [];
  const categories = Array.isArray(catsRes?.data) ? catsRes.data : catsRes?.data?.categories || [];

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "MWP University",
    url: absoluteUrl("/university"),
    blogPost: posts.slice(0, 24).map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absoluteUrl(`/university/${p.slug}`), datePublished: p.createdAt })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(blogLd) }} />
      <UniversityClient initialPosts={posts} initialCategories={categories} />
    </>
  );
}
