import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import "./certificate-marquee.css";

// Logos come from the same list as /certificates, so admin edits show here too.
// The FDA name and logo are never shown (it could suggest FDA approval of the products).
const isFda = (c) => /\bFDA\b/i.test(`${c.title || ""} ${c.heading || ""}`);

export default async function CertificateMarquee() {
  let items = [];
  try {
    const res = await fetchApi("/certificates");
    items = (res?.data?.certificates || []).filter((c) => c.logoUrl && !isFda(c));
  } catch {
    return null;
  }
  if (items.length === 0) return null;

  // repeat so one set is always wider than the screen, then render the set twice for a seamless loop
  const base = items.length < 6 ? [...items, ...items, ...items] : items;
  const Set = ({ hidden }) => (
    <ul className="mwp-cert-set" aria-hidden={hidden || undefined}>
      {base.map((c, i) => (
        <li key={`${c.id || c.title}-${i}`} className="mwp-cert-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.logoUrl} alt={hidden ? "" : `${c.heading || c.title} logo`} loading="lazy" />
          <span>{c.heading || c.title}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section className="mwp-cert-marquee" aria-label="Our quality credentials">
      <p className="mwp-cert-kicker">Quality you can verify</p>
      <Link href="/certificates" className="mwp-cert-track" aria-label="View all certificates and documents">
        <div className="mwp-cert-rail">
          <Set />
          <Set hidden />
        </div>
      </Link>
    </section>
  );
}
