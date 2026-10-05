"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconBook2, IconSearch } from "@tabler/icons-react";
import { fetchApi, formatDate } from "@/lib/utils";
import { CollectionStillLife, PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";

export default function UniversityPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchApi("/content/blog-categories").then(r => { if (alive) setCategories(Array.isArray(r?.data) ? r.data : r?.data?.categories || []); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    const query = new URLSearchParams({ limit: "24" });
    if (active !== "all") query.set("category", active);
    fetchApi(`/content/blog?${query}`).then(r => { if (alive) setPosts(r?.data?.posts || []); })
      .catch(() => { if (alive) setError("We couldn't load the articles. Please try again."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [active, retry]);
  const filtered = useMemo(() => posts.filter(p => `${p.title} ${p.summary || ""}`.toLowerCase().includes(search.trim().toLowerCase())), [posts, search]);
  return <div className="mwp-page">
    <div className="mwp-container"><PageBreadcrumb current="MWP University" /><section className="mwp-library-hero"><div><h1 className="mwp-title">A little knowledge.<br />A better daily routine.</h1><p className="mwp-lead">Welcome to MWP University. Explore ingredients, get to know your formulas, and make more informed choices about everyday wellness.</p><div className="mwp-actions"><a href="#articles" className="mwp-button">Browse articles</a><Link href="/ingredients" className="mwp-text-link">Explore ingredients</Link></div></div><CollectionStillLife /></section></div>
    <section id="articles" className="mwp-section border-t border-neutral-200"><div className="mwp-container">
      <div className="mwp-library-toolbar"><div><h2>The reading room</h2><p className="mt-2 text-sm text-neutral-500">Learn at your own pace.</p></div><div className="relative w-full sm:w-80"><IconSearch className="absolute left-4 top-4 h-4 w-4 text-neutral-500" /><input className="mwp-field !pl-11" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles" aria-label="Search articles" /></div></div>
      <div className="mwp-topic-list" aria-label="Article categories"><button className="mwp-chip" aria-pressed={active === "all"} onClick={() => setActive("all")}>All articles</button>{categories.map(c => <button key={c.id || c.slug} className="mwp-chip" aria-pressed={active === c.slug} onClick={() => setActive(c.slug)}>{c.name}</button>)}</div>
      {loading ? <div className="mwp-article-grid" role="status" aria-label="Loading articles">{[0,1,2].map(i => <div className="mwp-skeleton" key={i} />)}</div> : error ? <div className="mwp-empty" role="alert"><h2>Articles are unavailable</h2><p>{error}</p><button className="mwp-button" onClick={() => setRetry(r => r + 1)}>Try again</button></div> : filtered.length === 0 ? <div className="mwp-empty"><IconBook2 className="mx-auto h-8 w-8 text-neutral-500" /><h2>{posts.length ? "No matching articles" : "More to learn, soon."}</h2><p>{posts.length ? "Try another search or browse all articles." : "New articles will appear here as they are published. In the meantime, get to know the ingredients in your formula."}</p>{posts.length ? <button className="mwp-button mwp-button-outline" onClick={() => { setSearch(""); setActive("all"); }}>Clear search & filters</button> : <Link className="mwp-button mwp-button-outline" href="/ingredients">Browse ingredients</Link>}</div> : <div className="mwp-article-grid">{filtered.map(post => <Link key={post.id} href={`/university/${post.slug}`} className="mwp-article-link"><div className="mwp-article-cover">{post.coverImageUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.coverImageUrl} alt={post.title} loading="lazy" /> : <div className="flex h-full items-center justify-center"><IconBook2 className="h-10 w-10 text-neutral-400" /></div>}</div><div className="mwp-article-meta">{post.categories?.slice(0,2).map(c => <span key={c.id}>{c.name}</span>)}{post.createdAt && <span>{formatDate(post.createdAt)}</span>}</div><h3>{post.title}</h3>{post.summary && <p className="line-clamp-3">{post.summary}</p>}<span className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Read article</span></Link>)}</div>}
    </div></section><PageNextSteps />
  </div>;
}
