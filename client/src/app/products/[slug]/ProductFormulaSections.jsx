"use client";

import Link from "next/link";

// Data-driven "Inside the formula" block. Everything shown here comes from the
// product record (ingredientItems, servingSize, whenToTake, shippingReturn,
// legalInfo), all editable from the admin panel. A card/section with no data
// is simply not rendered.
export default function ProductFormulaSections({ product }) {
  const items = product.ingredientItems || [];
  const howToUse = [product.servingSize, product.whenToTake].filter(Boolean).join(" · ");

  const infoCards = [
    { title: "How to use", body: howToUse },
    { title: "Shipping & returns", body: product.shippingReturn },
    { title: "Quality & trust", body: product.legalInfo },
  ].filter((c) => c.body);

  if (items.length === 0 && infoCards.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 mb-16 md:mb-20">
      {items.length > 0 && (
        <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-neutral-900">
                Inside the formula
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-neutral-200 bg-white px-4 py-3"
                  >
                    <p className="text-[14px] font-medium text-neutral-900">{item.name}</p>
                    {(item.amount || item.source) && (
                      <p className="mt-0.5 text-[12px] text-neutral-500">
                        {[item.amount, item.source].filter(Boolean).join(" • ")}
                      </p>
                    )}
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
                  className="rounded-full bg-neutral-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700"
                >
                  Explore ingredients
                </Link>
                <Link
                  href="/certificates"
                  className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-[13px] font-medium text-neutral-900 transition-colors hover:border-neutral-900"
                >
                  See lab results
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {infoCards.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {infoCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="text-[16px] font-semibold text-neutral-900">{card.title}</h3>
              <p className="mt-2 line-clamp-5 text-[13px] leading-relaxed text-neutral-500">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
