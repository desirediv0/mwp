"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { IconBook2, IconSearch, IconX, IconArrowRight, IconArrowUpRight, IconLeaf, IconFlask2, IconCertificate } from "@tabler/icons-react";
import { fetchApi, formatDate } from "@/lib/utils";
import { PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";
import { EditorialCanvas } from "@/components/layout/EditorialCanvas";

const SHORTCUTS = [
  { href: "/ingredients", Icon: IconLeaf, title: "Meet the ingredients", text: "A clear introduction to what goes into MWP." },
  { href: "/products", Icon: IconFlask2, title: "Understand your formula", text: "Explore the collection and daily routines." },
  { href: "/certificates", Icon: IconCertificate, title: "Look at the details", text: "Browse our published quality documents." },
];

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

  return (
    <EditorialCanvas className="mwp-university">
      <div className="mwp-container">
        <PageBreadcrumb current="MWP University" />
        <section className="mwp-library-hero">
          <div data-editorial-reveal>
            <p className="mwp-editorial-kicker"><IconBook2 size={17} stroke={1.5} /> MWP UNIVERSITY</p>
            <h1 className="mwp-title">A little knowledge.<br /><span>A better everyday.</span></h1>
            <p className="mwp-lead">A place to slow down, learn and make sense of your wellness routine. Get to know your ingredients, your formulas and the details behind them.</p>
            <div className="mwp-actions"><a href="#articles" className="mwp-button">Enter the reading room <IconArrowRight size={17} /></a><Link href="/ingredients" className="mwp-text-link">Explore ingredients</Link></div>
          </div>
          <aside className="mwp-learning-art" data-editorial-reveal aria-label="Start learning">
            <p>GOOD QUESTIONS. CLEARER CHOICES.</p>
            <div className="mwp-learning-heading"><span><IconBook2 size={30} stroke={1.2} /></span><div><h2>Your learning<br />starts here.</h2><p>Explore one topic at a time.</p></div></div>
            <div className="mwp-learning-shortcuts">{SHORTCUTS.map(({ href, Icon, title, text }) => <Link key={href} href={href}><Icon size={21} stroke={1.4} /><div><strong>{title}</strong><small>{text}</small></div><IconArrowUpRight size={17} /></Link>)}</div>
          </aside>
        </section>
      </div>
      <section id="articles" className="mwp-section border-t border-neutral-200" style={{ scrollMarginTop: 132 }}>
        <div className="mwp-container">
          <div className="mwp-library-toolbar"><div><p className="mwp-editorial-kicker">THE READING ROOM</p><h2>Learn at your own pace.</h2></div><div className="mwp-editorial-search"><IconSearch size={18} /><input className="mwp-field" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find your next read..." aria-label="Search articles" />{search && <button aria-label="Clear article search" onClick={() => setSearch("")}><IconX size={17} /></button>}</div></div>
          <div className="mwp-topic-list" role="group" aria-label="Article categories"><button className="mwp-chip" aria-pressed={active === "all"} onClick={() => setActive("all")}>All articles</button>{categories.map(c => <button key={c.id || c.slug} className="mwp-chip" aria-pressed={active === c.slug} onClick={() => setActive(c.slug)}>{c.name}</button>)}</div>
          {!loading && !error && <p className="mwp-editorial-results" aria-live="polite"><span>{filtered.length}</span> {filtered.length === 1 ? "article" : "articles"} to explore</p>}
          {loading ? <div className="mwp-article-grid" role="status" aria-label="Loading articles">{[0, 1, 2].map(i => <div className="mwp-skeleton" key={i} />)}</div>
            : error ? <div className="mwp-empty" role="alert"><h2>Articles are unavailable</h2><p>{error}</p><button className="mwp-button" onClick={() => setRetry(r => r + 1)}>Try again</button></div>
            : filtered.length === 0 ? <div className="mwp-empty"><IconBook2 className="mx-auto h-9 w-9" stroke={1.3} /><h2>{posts.length ? "No matching articles" : "More to learn, soon."}</h2><p>{posts.length ? "Try another search or browse all articles." : "New articles will appear here as they are published. In the meantime, get to know the ingredients in your formula."}</p>{posts.length ? <button className="mwp-button mwp-button-outline" onClick={() => { setSearch(""); setActive("all"); }}>Clear search &amp; filters</button> : <Link className="mwp-button mwp-button-outline" href="/ingredients">Browse ingredients <IconArrowRight size={16} /></Link>}</div>
            : <div className="mwp-article-grid">{filtered.map(post => <Link key={post.id} href={`/university/${post.slug}`} className="mwp-article-link"><div className="mwp-article-cover">{post.coverImageUrl ? <Image src={post.coverImageUrl} alt="" width={640} height={400} unoptimized /> : <div className="flex h-full items-center justify-center"><IconBook2 className="h-12 w-12 text-[#9caf88]" stroke={1.2} /></div>}</div><div className="mwp-article-meta">{post.categories?.slice(0, 2).map(c => <span key={c.id}>{c.name}</span>)}{post.createdAt && <span>{formatDate(post.createdAt)}</span>}</div><h3>{post.title}</h3>{post.summary && <p className="line-clamp-3">{post.summary}</p>}<span className="mwp-article-read">Read article <IconArrowUpRight size={17} /></span></Link>)}</div>}
        </div>
      </section>
      <PageNextSteps />
    </EditorialCanvas>
  );
}
