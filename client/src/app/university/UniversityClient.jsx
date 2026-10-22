"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { IconBook2, IconSearch, IconX, IconArrowRight, IconArrowUpRight, IconLeaf, IconFlask2, IconCertificate, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { formatDate } from "@/lib/utils";
import { PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";
import { EditorialCanvas } from "@/components/layout/EditorialCanvas";
import { universityHref } from "@/lib/university-links";
import "./university.css";

const SHORTCUTS = [
  { href: "/ingredients", Icon: IconLeaf, title: "Meet the ingredients", text: "What goes into MWP." },
  { href: "/products", Icon: IconFlask2, title: "Understand your formula", text: "The collection and routines." },
  { href: "/certificates", Icon: IconCertificate, title: "Look at the details", text: "Published quality documents." },
];

// 1 ... 4 5 [6] 7 8 ... 20
function pageList(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach(n => set.add(n));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach(n => set.add(n));
  const nums = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap-" + n);
    out.push(n);
  });
  return out;
}

function Pagination({ page, totalPages, category }) {
  if (totalPages <= 1) return null;
  const items = pageList(page, totalPages);
  return (
    <nav className="mwp-pagination" aria-label="Article pages">
      {page > 1
        ? <Link href={universityHref(category, page - 1)} rel="prev" className="mwp-page-btn" aria-label="Previous page"><IconChevronLeft size={16} /> <span>Previous</span></Link>
        : <span className="mwp-page-btn is-disabled" aria-disabled="true"><IconChevronLeft size={16} /> <span>Previous</span></span>}
      <ul>
        {items.map(n => typeof n === "string"
          ? <li key={n} className="mwp-page-gap" aria-hidden="true">&hellip;</li>
          : <li key={n}><Link href={universityHref(category, n)} className={`mwp-page-num${n === page ? " is-current" : ""}`} aria-current={n === page ? "page" : undefined} aria-label={`Page ${n}`}>{n}</Link></li>)}
      </ul>
      {page < totalPages
        ? <Link href={universityHref(category, page + 1)} rel="next" className="mwp-page-btn" aria-label="Next page"><span>Next</span> <IconChevronRight size={16} /></Link>
        : <span className="mwp-page-btn is-disabled" aria-disabled="true"><span>Next</span> <IconChevronRight size={16} /></span>}
    </nav>
  );
}

export default function UniversityClient({ posts = [], categories = [], activeCategory = "all", page = 1, totalPages = 1, totalPosts = 0, failed = false }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => posts.filter(p => `${p.title} ${p.summary || ""}`.toLowerCase().includes(search.trim().toLowerCase())), [posts, search]);

  return (
    <EditorialCanvas className="mwp-university">
      <div className="mwp-container">
        <PageBreadcrumb current="MWP University" />
        <section className="mwp-library-hero">
          <div data-editorial-reveal>
            <p className="mwp-editorial-kicker"><IconBook2 size={16} stroke={1.5} /> MWP UNIVERSITY</p>
            <h1 className="mwp-title">A little knowledge.<br /><span>A better everyday.</span></h1>
            <p className="mwp-lead">Learn about your ingredients, your formulas and the details behind them, one clear guide at a time.</p>
            <div className="mwp-actions"><a href="#articles" className="mwp-button">Enter the reading room <IconArrowRight size={16} /></a><Link href="/ingredients" className="mwp-text-link">Explore ingredients</Link></div>
          </div>
          <aside className="mwp-learning-art" data-editorial-reveal aria-label="Start learning">
            <div className="mwp-learning-shortcuts">{SHORTCUTS.map(({ href, Icon, title, text }) => <Link key={href} href={href}><Icon size={20} stroke={1.4} /><div><strong>{title}</strong><small>{text}</small></div><IconArrowUpRight size={16} /></Link>)}</div>
          </aside>
        </section>
      </div>

      <section id="articles" className="mwp-section border-t border-neutral-200" style={{ scrollMarginTop: 120 }}>
        <div className="mwp-container">
          <div className="mwp-library-toolbar">
            <div><p className="mwp-editorial-kicker">THE READING ROOM</p><h2>Learn at your own pace.</h2></div>
            <div className="mwp-editorial-search">
              <IconSearch size={18} />
              <input className="mwp-field" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search these articles..." aria-label="Search articles on this page" />
              {search && <button aria-label="Clear article search" onClick={() => setSearch("")}><IconX size={17} /></button>}
            </div>
          </div>

          <div className="mwp-topic-list" role="group" aria-label="Article categories">
            <Link href={universityHref("all", 1)} className="mwp-chip" aria-pressed={activeCategory === "all"} scroll={false}>All articles</Link>
            {categories.map(c => <Link key={c.id || c.slug} href={universityHref(c.slug, 1)} className="mwp-chip" aria-pressed={activeCategory === c.slug} scroll={false}>{c.name}</Link>)}
          </div>

          {!failed && <p className="mwp-editorial-results" aria-live="polite">
            {search ? <><span>{filtered.length}</span> {filtered.length === 1 ? "match" : "matches"} on this page</> : <><span>{totalPosts}</span> {totalPosts === 1 ? "article" : "articles"} to explore{totalPages > 1 && <> &middot; page {page} of {totalPages}</>}</>}
          </p>}

          {failed ? <div className="mwp-empty" role="alert"><h2>Articles are unavailable</h2><p>We could not load the articles. Please try again in a moment.</p><Link className="mwp-button" href={universityHref(activeCategory, page)}>Try again</Link></div>
            : filtered.length === 0 ? <div className="mwp-empty"><IconBook2 className="mx-auto h-9 w-9" stroke={1.3} /><h2>{posts.length ? "No matching articles" : "More to learn, soon."}</h2><p>{posts.length ? "Try another search or clear it to see every article on this page." : "New articles will appear here as they are published. In the meantime, get to know the ingredients in your formula."}</p>{posts.length ? <button className="mwp-button mwp-button-outline" onClick={() => setSearch("")}>Clear search</button> : <Link className="mwp-button mwp-button-outline" href="/ingredients">Browse ingredients <IconArrowRight size={16} /></Link>}</div>
            : <div className="mwp-article-grid">{filtered.map(post => (
                <Link key={post.id} href={`/university/${post.slug}`} className="mwp-article-link">
                  <div className="mwp-article-cover">{post.coverImageUrl ? <Image src={post.coverImageUrl} alt={post.title} width={640} height={400} unoptimized /> : <div className="flex h-full items-center justify-center"><IconBook2 className="h-12 w-12 text-[#C9992F]" stroke={1.2} /></div>}</div>
                  <div className="mwp-article-meta">{post.categories?.slice(0, 2).map(c => <span key={c.id}>{c.name}</span>)}{post.readingMinutes ? <span>{post.readingMinutes} min read</span> : null}{post.createdAt && <span>{formatDate(post.createdAt)}</span>}</div>
                  <h3>{post.title}</h3>
                  {post.summary && <p className="line-clamp-3">{post.summary}</p>}
                  <span className="mwp-article-read">Read article <IconArrowUpRight size={17} /></span>
                </Link>))}</div>}

          {!failed && !search && <Pagination page={page} totalPages={totalPages} category={activeCategory} />}
        </div>
      </section>
      <PageNextSteps />
    </EditorialCanvas>
  );
}
