"use client";

import Link from "next/link";

// Data-driven "Inside the formula" block. Everything shown here comes from the
// product record (ingredientItems, servingSize, whenToTake, shippingReturn,
// legalInfo), all editable from the admin panel. Colors come from the page's
// per-product theme variables (--product-line / --product-accent).
const plain = (html) =>
  (html || "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

export default function ProductFormulaSections({ product }) {
  const items = product.ingredientItems || [];
  const copy = product.pageContent || {};
  const howToUse = [product.servingSize, product.whenToTake].filter(Boolean).join(" · ");

  const infoCards = [
    { title: "How to use", body: howToUse },
    {
      title: "Shipping & returns",
      body: plain(product.shippingReturn) || "Secure checkout, order tracking and clear customer support.",
      href: "/shipping-policy",
    },
    {
      title: "Made for trust",
      body: plain(product.legalInfo) || "Certifications, independent testing and product documentation in one place.",
      href: "/certificates",
    },
  ].filter((c) => c.body);

  if (items.length === 0 && infoCards.length === 0) return null;

  const outline =
    "rounded-[10px] border border-[color:var(--product-accent)] bg-white px-[18px] py-2 text-[12px] font-semibold text-[color:var(--product-accent)] transition-colors hover:bg-[color:var(--product-surface)]";

  return (
    <section className="mwp-product-formula mx-auto mb-12 max-w-6xl px-6 lg:px-10">
      {items.length > 0 && (
        <div className="mwp-formula-panel rounded-[28px] border bg-[#fffbf8] p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
            <div>
              <h2 className="mwp-serif text-[28px] font-bold leading-tight text-[#211c1b] sm:text-[32px]">Inside the formula</h2>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[10px] border border-[color:var(--product-line)] bg-white px-3.5 py-2.5"
                  >
                    <p className="text-[12.5px] text-[#211c1b]">{item.name}</p>
                    {(item.amount || item.source) && (
                      <p className="mt-0.5 text-[11px] text-[color:var(--product-accent)]">
                        {[item.amount, item.source].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mwp-serif text-[28px] font-bold leading-tight text-[#211c1b] sm:text-[32px]">
                {copy.transparencyTitle || "Why transparency matters"}
              </h2>
              <p className="mt-4 text-[13px] leading-relaxed text-[#625955]">
                {copy.transparencyText ||
                  "Every ingredient opens to a simple explanation, its dose and where it comes from. Nothing hidden behind a proprietary blend."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link href={`/ingredients/product/${product.id}`} className={outline}>
                  Explore Ingredients
                </Link>
                <Link href="/certificates" className={outline}>
                  See Lab Results
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {infoCards.length > 0 && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {infoCards.map((card) => {
            const inner = (
              <>
                <h3 className="mwp-serif text-[20px] font-bold text-[#211c1b]">{card.title}</h3>
                <p className="mt-2 line-clamp-4 text-[12.5px] leading-relaxed text-[#756c68]">{card.body}</p>
              </>
            );
            const cls =
              "block rounded-[14px] border border-[color:var(--product-line)] bg-white p-5 transition-colors";
            return card.href ? (
              <Link key={card.title} href={card.href} className={`${cls} hover:border-[color:var(--product-accent)]`}>
                {inner}
              </Link>
            ) : (
              <div key={card.title} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-9 text-center text-[11px] text-[#85756f]">
        {copy.footerNote || "MWP Supplements • Premium performance. Transparent formula. Independently tested."}
      </p>
    </section>
  );
}
