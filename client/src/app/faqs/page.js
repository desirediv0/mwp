"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconSearch, IconPlus, IconArrowRight } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { SITE_CONTACT } from "@/lib/siteContact";

const pickList = (res, key) => {
  if (res?.data?.[key] && Array.isArray(res.data[key])) return res.data[key];
  if (Array.isArray(res?.data)) return res.data;
  if (res?.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchApi("/faqs");
        if (alive) setFaqs(pickList(res, "faqs"));
        const cats = await fetchApi("/faqs/categories");
        if (alive) setCategories(pickList(cats, "categories").map((c) => c.name));
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs
      .filter((f) => activeCategory === "all" || f.category === activeCategory)
      .filter((f) => !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [faqs, searchQuery, activeCategory]);

  const chip = (active) =>
    `rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-colors ${
      active
        ? "border-[#111214] bg-[#111214] text-white"
        : "border-[#e3d7c5] bg-white text-neutral-700 hover:border-neutral-900"
    }`;

  return (
    <main className="bg-[#f6f1ea] text-neutral-900">
      <div className="mx-auto max-w-4xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#8a6a35]">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">FAQs</span>
        </nav>

        <header className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#8f6f3a] sm:text-xs">A little help, right here</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Frequently asked <span className="text-[#8f6f3a]">questions.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
            Quick answers about our products, ordering, shipping and returns.
          </p>
        </header>

        <div className="relative mt-10">
          <IconSearch aria-hidden="true" size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            aria-label="Search FAQs"
            className="w-full rounded-2xl border border-[#e3d7c5] bg-white py-4 pl-14 pr-5 text-[17px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
          />
        </div>

        {categories.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Question categories">
            <button type="button" onClick={() => setActiveCategory("all")} className={chip(activeCategory === "all")}>
              All questions
            </button>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setActiveCategory(c)} className={chip(activeCategory === c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading questions">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white/70" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <ul className="space-y-3">
              {filtered.map((faq) => {
                const open = openId === faq.id;
                return (
                  <li key={faq.id} className="overflow-hidden rounded-2xl border border-[#e8dccb] bg-white">
                    <h2>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenId(open ? null : faq.id)}
                        className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left text-[18px] font-semibold leading-snug sm:text-xl"
                      >
                        {faq.question}
                        <IconPlus
                          aria-hidden="true"
                          size={22}
                          className={`shrink-0 text-[#8f6f3a] transition-transform duration-200 ${open ? "rotate-45" : ""}`}
                        />
                      </button>
                    </h2>
                    {open && (
                      <div className="border-t border-[#f0e6d6] px-6 pb-6 pt-4 text-[17px] leading-[1.8] text-neutral-700 whitespace-pre-line">
                        {faq.answer}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-[#e8dccb] bg-white px-6 py-12 text-center">
              <p className="text-xl font-semibold">
                {faqs.length === 0 ? "No questions are published yet." : `No questions found for “${searchQuery}”.`}
              </p>
              {faqs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="mt-3 text-[16px] font-semibold text-[#8f6f3a] underline underline-offset-4"
                >
                  View all questions
                </button>
              )}
            </div>
          )}
        </div>

        <section className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#111214] p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Still have questions?</h2>
            <p className="mt-2 text-[16px] text-neutral-300">
              Email <a className="font-semibold text-[#e5c56a]" href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a> or
              call {SITE_CONTACT.phone}, {SITE_CONTACT.hours}.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e5c56a] px-6 py-3 text-sm font-bold text-[#111214] transition-colors hover:bg-white"
          >
            Contact us <IconArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
