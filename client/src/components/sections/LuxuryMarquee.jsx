"use client";

const WORDS = [
  "Nightfall Edition",
  "Velvet Allure",
  "Noir Petals",
  "Luxury Fragrances",
  "Artisan Perfumery",
  "Handcrafted Scents",
];

function MarqueeRow() {
  return (
    <div className="flex items-center flex-shrink-0" aria-hidden="true">
      {WORDS.map((item, i) => (
        <span key={i} className="flex items-center">
          <span
            className={
              i % 2 === 0
                ? "font-display italic text-2xl md:text-4xl text-gold-light whitespace-nowrap px-5 md:px-8 tracking-wide"
                : "font-display text-2xl md:text-4xl text-hollow whitespace-nowrap px-5 md:px-8 tracking-wide uppercase"
            }
          >
            {item}
          </span>
          <span className="text-xs text-gold/40">—</span>
        </span>
      ))}
    </div>
  );
}

export default function LuxuryMarquee() {
  return (
    <section
      className="relative bg-noir py-6 md:py-8 select-none overflow-hidden border-y border-white/5"
      aria-label="MWP SUPPLEMENTS highlights"
    >
      <div className="luxe-marquee relative z-10">
        <div className="luxe-marquee-track">
          <MarqueeRow />
          <MarqueeRow />
        </div>
      </div>
    </section>
  );
}
