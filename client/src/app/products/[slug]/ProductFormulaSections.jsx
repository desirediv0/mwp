"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/utils";

const outlineButton = "inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-900 bg-white px-5 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900";

// Data-driven "Inside the formula" block. Everything shown here comes from the
// product record (ingredientItems, servingSize, whenToTake, shippingReturn,
// legalInfo), all editable from the admin panel. A card/section with no data
// is simply not rendered.
export default function ProductFormulaSections({ product }) {
  const [hasCertificates, setHasCertificates] = useState(false);
  useEffect(() => {
    let active = true;
    fetchApi("/certificates")
      .then((response) => {
        if (active) setHasCertificates((response?.data?.certificates || []).length > 0);
      })
      .catch(() => { if (active) setHasCertificates(false); });
    return () => { active = false; };
  }, []);
  const items = product.ingredientItems || [];
  const howToUse = [product.servingSize, product.whenToTake].filter(Boolean).join(" · ");
  // shippingReturn / legalInfo are rich-text (HTML) in the admin; show them as plain text here.
  const plain = (html) =>
    (html || "")
      .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

  const infoCards = [
    { title: "How to use", body: howToUse },
    { title: "Shipping & returns", body: plain(product.shippingReturn) },
    { title: "Quality & trust", body: plain(product.legalInfo) },
  ].filter((c) => c.body);

  const downloadFormula = () => {
    const text = [product.name, plain(product.description), "", "Ingredients",
      ...items.map(item => `${item.name} — ${[item.amount, item.source].filter(Boolean).join(" · ")}\n${plain(item.description)}`),
      "", "How to use", howToUse || "Follow the directions on the product label.",
    ].join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${product.slug}-formula.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (items.length === 0 && infoCards.length === 0) return null;

  return (
    <section className="mwp-product-formula max-w-6xl mx-auto px-6 lg:px-10 mb-16 md:mb-20 text-neutral-900">
      {items.length > 0 && (
        <div className="mwp-formula-panel rounded-3xl border border-[#e6ded2] bg-white p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
                Inside the formula
              </h2>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-[#e6ded2] bg-white overflow-hidden"
                  >
                    <details className="group px-4 py-3">
                    <summary className="cursor-pointer list-none focus-visible:outline-neutral-900">
                    <p className="text-[14px] font-medium text-neutral-900">{item.name}</p>
                    {(item.amount || item.source) && (
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {[item.amount, item.source].filter(Boolean).join(" • ")}
                      </p>
                    )}
                    <span className="mt-1 block text-[10px] text-neutral-500 group-open:hidden">Details +</span>
                    </summary>
                    <div className="mt-3 pt-3 border-t border-neutral-100 text-[13px] leading-relaxed text-neutral-600">
                      {item.scientificName && <p className="italic mb-2">{item.scientificName}</p>}
                      <p>{plain(item.description) || "Further details will be added when available."}</p>
                      {item.type && <p className="mt-2">Type: {item.type}</p>}
                    </div>
                    </details>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
                Why transparency matters
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
                Every ingredient opens to a simple explanation, its dose and where it comes from.
                Nothing hidden behind a proprietary blend.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/ingredients/product/${product.id}`}
                  className={outlineButton}
                >
                  Explore ingredients
                </Link>
                {hasCertificates && <Link
                  href="/certificates"
                  className={outlineButton}
                >
                  See lab results
                </Link>}
              </div>
            </div>
          </div>
        </div>
      )}

      {(hasCertificates || items.length > 0) && <div className="mt-5 flex flex-wrap gap-3">
        {hasCertificates && <Link href="/certificates" className={outlineButton}>View COA &amp; testing</Link>}
        {items.length > 0 && <button type="button" onClick={downloadFormula} className={outlineButton}>Download formula</button>}
      </div>}

      {infoCards.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {infoCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-[#e6ded2] bg-white p-5">
              <h3 className="text-[16px] font-semibold text-neutral-900">{card.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                {card.body}
              </p>
              {card.title === "Shipping & returns" && <Link href="/shipping-policy" className="mt-3 inline-block text-[13px] underline">Shipping policy</Link>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
