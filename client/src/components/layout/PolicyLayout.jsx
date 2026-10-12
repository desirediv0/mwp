import Link from "next/link";
import { IconMail, IconPhone, IconClock, IconArrowRight } from "@tabler/icons-react";
import { SITE_CONTACT } from "@/lib/siteContact";

// Shared layout for legal / policy pages: large readable type, warm cream + gold theme,
// numbered sections with a "On this page" index, and a support card at the end.

export function P({ children, className = "" }) {
  return <p className={`text-[17px] leading-[1.85] text-neutral-700 ${className}`}>{children}</p>;
}

export function UL({ items }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[17px] leading-[1.75] text-neutral-700">
          <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a15a]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Note({ children, tone = "gold" }) {
  const tones = {
    gold: "border-[#e3d3a8] bg-[#fbf5e6] text-[#5c4a1e]",
    dark: "border-neutral-800 bg-[#111214] text-neutral-100",
  };
  return <div className={`mt-5 rounded-2xl border px-5 py-4 text-[16px] leading-relaxed ${tones[tone]}`}>{children}</div>;
}

export function Steps({ steps }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-2xl border border-[#e8dccb] bg-[#fffbf5] p-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111214] text-sm font-bold text-[#e5c56a]">
            {i + 1}
          </span>
          <h3 className="mt-3 text-lg font-bold text-neutral-900">{s.title}</h3>
          <p className="mt-1 text-[15.5px] leading-relaxed text-neutral-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export default function PolicyLayout({ kicker, title, accent, intro, updated, highlights = [], sections, contactTitle }) {
  return (
    <main className="bg-[#f6f1ea] text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-[12px] text-[#8a6a35]">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">{title}{accent ? ` ${accent}` : ""}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#8f6f3a] sm:text-xs">{kicker}</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {title}
            {accent && <span className="text-[#8f6f3a]"> {accent}</span>}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-600 sm:text-xl">{intro}</p>
          {updated && <p className="mt-4 text-sm font-medium text-neutral-500">Last updated: {updated}</p>}
        </header>

        {highlights.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map((h) => (
              <div key={h.title} className="rounded-[1.6rem] border border-[#e8dccb] bg-white p-6">
                <h2 className="text-xl font-bold">{h.title}</h2>
                <p className="mt-2 text-[16px] leading-relaxed text-neutral-600">{h.text}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 grid gap-10 lg:grid-cols-[250px_1fr]">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#8a6a35]">On this page</p>
            <ol className="mt-4 space-y-1 border-l border-[#e3d7c5]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[15px] text-neutral-600 transition-colors hover:border-[#c9a15a] hover:text-neutral-900"
                  >
                    <span className="mr-2 text-xs font-bold text-[#c9a15a]">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="space-y-6">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                style={{ scrollMarginTop: 130 }}
                className="rounded-[2rem] border border-[#e8dccb] bg-white p-6 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.25)] sm:p-10"
              >
                <p className="text-xs font-bold tracking-[0.3em] text-[#c9a15a]">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">{s.title}</h2>
                <div className="mt-5 space-y-4">{s.body}</div>
              </section>
            ))}
          </div>
        </div>

        <section className="mt-14 grid items-center gap-8 rounded-[2rem] bg-[#111214] p-8 text-white sm:p-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#e5c56a]">Direct support</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {contactTitle || "Questions? We’re happy to help."}
            </h2>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e5c56a] px-6 py-3 text-sm font-bold text-[#111214] transition-colors hover:bg-white"
            >
              Contact us <IconArrowRight size={16} />
            </Link>
          </div>
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {[
              { Icon: IconMail, label: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}` },
              { Icon: IconPhone, label: "Call", value: SITE_CONTACT.phone, href: SITE_CONTACT.phoneHref },
              { Icon: IconClock, label: "Support hours", value: SITE_CONTACT.hours },
            ].map(({ Icon, label, value, href }) => {
              const inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9a15a] text-[#111214]">
                    <Icon size={18} stroke={2} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-[15px] text-neutral-300">{value}</span>
                  </span>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} className="flex items-center gap-4 py-4 hover:opacity-80">{inner}</a>
                  ) : (
                    <div className="flex items-center gap-4 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-8 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">
          {SITE_CONTACT.company} · {SITE_CONTACT.mailing}
        </p>
      </div>
    </main>
  );
}
