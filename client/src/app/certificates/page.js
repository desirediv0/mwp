"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { TRUST_CLAIMS } from "@/lib/trustClaims";

const PILLS = TRUST_CLAIMS;

function CertificateCard({ c }) {
  const hasFile = !!c.fileUrl;
  const art = (
    <div className="relative flex h-[220px] flex-col items-center justify-center rounded-md border border-[#d9bf86] bg-gradient-to-br from-white to-[#fbf6ea] px-6 text-center sm:h-[230px]">
      <span aria-hidden="true" className="absolute left-2.5 top-2.5 h-10 w-12 border-l border-t border-[#c9a15a]" />
      <span aria-hidden="true" className="absolute bottom-2.5 right-2.5 h-10 w-12 border-b border-r border-[#c9a15a]" />
      {c.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.logoUrl} alt={c.heading || c.title} className="h-24 w-24 object-contain sm:h-28 sm:w-28" />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c9a15a] text-[13px] font-bold text-[#b08a43]">
          {c.badge || "✓"}
        </span>
      )}
      <p className={`${c.logoUrl ? "mt-3 text-lg" : "mt-4 text-xl"} font-bold tracking-tight text-neutral-900`}>{c.heading || c.title}</p>
      {!c.logoUrl && (c.summary || c.description) && (
        <p className="mt-2 max-w-[220px] text-[11px] leading-snug text-neutral-500">{c.summary || c.description}</p>
      )}
    </div>
  );

  const button = (
    <span
      className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.15em] ${
        hasFile ? "bg-[#161616] text-white group-hover:bg-neutral-700" : "bg-neutral-200 text-neutral-500"
      }`}
    >
      {hasFile ? (c.buttonLabel || "View document") : "Coming soon"}
      {hasFile && <IconArrowRight size={13} />}
    </span>
  );

  const body = (
    <>
      {art}
      <h3 className="mt-5 text-[15px] font-bold text-neutral-900">{c.title}</h3>
      {c.description && <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{c.description}</p>}
      {button}
    </>
  );

  const cardClass =
    "group flex flex-col rounded-[1.6rem] border border-[#e8dccb] bg-white p-3.5 shadow-[0_20px_50px_-35px_rgba(0,0,0,0.3)] transition-all";

  return hasFile ? (
    <a
      href={c.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.buttonLabel || "View"}: ${c.title}`}
      className={`${cardClass} hover:-translate-y-1 hover:shadow-[0_28px_60px_-30px_rgba(0,0,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900`}
    >
      {body}
    </a>
  ) : (
    <div className={cardClass}>{body}</div>
  );
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetchApi("/certificates")
      .then((r) => alive && setCertificates(r?.data?.certificates || []))
      .catch(() => alive && setError("Certificates couldn't be loaded. Please try again."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="bg-[#f8f5ee] text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#a8873f]">The MWP Certificate Wall</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
            Trust you can <span className="italic text-[#bd9650]">see.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-neutral-600">
            We believe transparency is part of quality. Explore the standards, testing, and documentation behind the MWP collection.
          </p>
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {PILLS.map((p) => (
            <li
              key={p}
              className="rounded-full border border-[#e8dccb] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a6a35]"
            >
              ✓ {p}
            </li>
          ))}
        </ul>

        <section className="mt-12">
          {loading ? (
            <div className="flex justify-center py-20" role="status" aria-label="Loading certificates">
              <IconLoader2 className="h-7 w-7 animate-spin text-neutral-400" />
            </div>
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-[#e8dccb] bg-white px-6 py-10 text-center text-sm text-neutral-600">
              {error}
            </p>
          ) : certificates.length === 0 ? (
            <p className="rounded-2xl border border-[#e8dccb] bg-white px-6 py-10 text-center text-sm text-neutral-600">
              Certificates will appear here when they are published.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c) => (
                <CertificateCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 grid items-center gap-8 rounded-[2rem] bg-gradient-to-br from-[#1c1a17] to-[#2f281f] p-8 text-white sm:p-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e5c56a]">Scan. Verify. Feel confident.</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Every package has a story behind it.</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-300">
              Use the QR code on your MWP package to access product information, ingredient details, available testing documents, and the latest quality updates.
            </p>
            <Link href="/contact" className="mt-6 inline-block text-sm font-semibold text-[#e5c56a] underline underline-offset-4">
              Questions about your bottle?
            </Link>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-[#c9a15a]/30 px-6 py-8">
            {/* Real QR for https://mwpsupplements.com/certificates (same one as the admin "Certificates Page QR") */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/certificates-qr.svg"
              alt="QR code that opens the MWP certificate wall"
              width={176}
              height={176}
              className="h-40 w-40 rounded-xl bg-white p-1 sm:h-44 sm:w-44"
            />
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em]">Scan for trust &amp; testing</p>
          </div>
        </section>

        <p className="mt-10 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
          MWP Supplements · Premium performance · Transparent formula
        </p>
      </div>
    </main>
  );
}
