import Link from "next/link";
import { IconArrowRight, IconCheck, IconFileCheck, IconShieldCheck, IconClockHour4, IconQrcode } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { TRUST_CLAIMS } from "@/lib/trustClaims";

export const revalidate = 300;

// The FDA's name and logo are never shown on this wall: they could suggest the FDA approves or endorses MWP products.
const isFda = (c) => /\bFDA\b/i.test(`${c.title || ""} ${c.heading || ""}`);
const showLogo = (c) => Boolean(c.logoUrl) && !isFda(c);

function CertificateCard({ c }) {
  const hasFile = Boolean(c.fileUrl);
  const heading = c.heading || c.title;

  const body = (
    <>
      <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#FBF5E6] via-white to-[#EEF1F8]">
        <span aria-hidden="true" className="absolute left-3 top-3 h-8 w-10 rounded-tl-xl border-l-2 border-t-2 border-[#D4A437]/70" />
        <span aria-hidden="true" className="absolute bottom-3 right-3 h-8 w-10 rounded-br-xl border-b-2 border-r-2 border-[#D4A437]/70" />
        {showLogo(c) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoUrl} alt={`${heading} logo`} loading="lazy" className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-[#D4A437]/70 bg-white text-[#12213F] shadow-[0_14px_28px_-18px_#12213F88]">
            {c.badge && c.badge !== "✓" ? <span className="text-[15px] font-semibold tracking-wide">{c.badge}</span> : <IconShieldCheck size={34} stroke={1.5} />}
          </span>
        )}
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            hasFile ? "bg-[#12213F] text-white" : "bg-white text-[#5A6275] ring-1 ring-[#E3E6EE]"
          }`}
        >
          {hasFile ? <><IconCheck size={11} stroke={2.4} /> Document</> : <><IconClockHour4 size={11} stroke={2} /> Coming soon</>}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A8741F]">{heading}</p>
        <h3 className="mt-1.5 text-[17px] font-semibold leading-snug text-[#12213F]">{c.title}</h3>
        {(c.description || c.summary) && <p className="mt-2 text-[13.5px] leading-relaxed text-[#5A6275]">{c.description || c.summary}</p>}
        <span
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            hasFile ? "bg-[#12213F] text-white group-hover:bg-[#B3001B]" : "bg-[#F1F2F6] text-[#6B7388]"
          }`}
        >
          {hasFile ? <>{c.buttonLabel || "View document"} <IconArrowRight size={14} /></> : "Document coming soon"}
        </span>
      </div>
    </>
  );

  const base = "group flex flex-col rounded-[1.75rem] border border-[#E8E2D0] bg-white p-3.5 shadow-[0_24px_50px_-38px_#12213F66] transition-all";
  return hasFile ? (
    <a
      href={c.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.buttonLabel || "View"}: ${c.title}`}
      className={`${base} hover:-translate-y-1 hover:border-[#D4A437] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#12213F]`}
    >
      {body}
    </a>
  ) : (
    <div className={base}>{body}</div>
  );
}

export default async function CertificatesPage() {
  let certificates = [];
  let failed = false;
  try {
    const res = await fetchApi("/certificates");
    certificates = res?.data?.certificates || [];
  } catch {
    failed = true;
  }

  return (
    <main className="bg-white text-[#12213F]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1530] via-[#12213F] to-[#1B2D52] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#D4A437]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-[#B3001B]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center sm:px-8 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E6C26A]">The MWP Certificate Wall</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Trust you can <span className="font-normal italic text-[#E6C26A]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>see.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#CDD4E6] sm:text-lg">
            We believe transparency is part of quality. Explore the standards, testing, and documentation behind the MWP collection.
          </p>
          <ul className="mx-auto mt-9 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
            {TRUST_CLAIMS.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-medium tracking-wide text-[#E3E7F2] backdrop-blur-sm">
                <IconCheck size={13} stroke={2.4} className="text-[#E6C26A]" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Certificates */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-9 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8741F]">Documents and standards</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What stands behind every bottle.</h2>
          </div>
          {certificates.length > 0 && (
            <p className="inline-flex items-center gap-2 text-sm text-[#5A6275]"><IconFileCheck size={18} stroke={1.5} className="text-[#A8741F]" /> {certificates.length} items on the wall</p>
          )}
        </div>

        {failed ? (
          <p role="alert" className="rounded-2xl border border-[#E8E2D0] bg-[#FBF5E6] px-6 py-10 text-center text-sm text-[#5A6275]">
            Certificates could not be loaded right now. Please try again in a moment.
          </p>
        ) : certificates.length === 0 ? (
          <p className="rounded-2xl border border-[#E8E2D0] bg-[#FBF5E6] px-6 py-10 text-center text-sm text-[#5A6275]">
            Certificates will appear here when they are published.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <CertificateCard key={c.id} c={c} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[12px] leading-relaxed text-[#6B7388]">
          Some documents are still being collected and are marked &ldquo;coming soon&rdquo;. Questions about a specific document?{" "}
          <Link href="/contact" className="text-[#A8741F] underline underline-offset-4">Contact us</Link>.
        </p>
      </section>

      {/* QR */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20">
        <div className="relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#12213F] to-[#0B1530] p-8 text-white sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D4A437]/25 blur-3xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E6C26A]">Scan. Verify. Feel confident.</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Every package has a story behind it.</h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#CDD4E6]">
              Use the QR code on your MWP package to access product information, ingredient details, available testing documents, and the latest quality updates.
            </p>
            <Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#E6C26A] underline underline-offset-4">
              Questions about your bottle? <IconArrowRight size={15} />
            </Link>
          </div>
          <div className="relative mx-auto flex flex-col items-center rounded-3xl border border-white/15 bg-white/10 px-8 py-8 backdrop-blur-sm">
            {/* Real QR for the certificate wall (same one as the admin "Certificates Page QR") */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/certificates-qr.svg" alt="QR code that opens the MWP certificate wall" width={176} height={176} className="h-40 w-40 rounded-2xl bg-white p-1.5 sm:h-44 sm:w-44" />
            <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"><IconQrcode size={16} /> Scan for trust &amp; testing</p>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#6B7388]">
          MWP Supplements &middot; Premium performance &middot; Transparent formula
        </p>
      </section>
    </main>
  );
}
