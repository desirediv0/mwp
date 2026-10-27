"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconCircleX,
  IconRefresh,
  IconExternalLink,
  IconArrowRight,
  IconCopy,
  IconCheck,
  IconFileCertificate,
  IconFlask,
  IconLeaf,
  IconMapPin,
} from "@tabler/icons-react";

const img = (raw) => {
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

const formatDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
};

// Descriptions come from the admin editor as HTML: show them as plain, readable paragraphs.
const toParagraphs = (html) =>
  String(html || "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .split("\n")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const STATUS = {
  ACTIVE: {
    tone: "ok",
    icon: IconShieldCheck,
    title: "Verified MWP product",
    text: "This code is registered with MWP Supplements. You are holding the real thing.",
  },
  INACTIVE: { tone: "warn", icon: IconAlertTriangle, title: "Verification unavailable", text: "This verification record is not active right now. Please contact us if you have questions." },
  EXPIRED: { tone: "warn", icon: IconAlertTriangle, title: "This record has expired", text: "The verification record for this code is no longer current. Check the date on your bottle or contact us." },
  SUSPENDED: { tone: "warn", icon: IconAlertTriangle, title: "Verification suspended", text: "This code is temporarily on hold. Please contact us before using this product." },
  REVOKED: { tone: "bad", icon: IconCircleX, title: "Verification revoked", text: "This code is no longer valid. If you bought this product, please contact us." },
};

const TONES = {
  ok: { bg: "#EAF6EE", border: "#BFE3CC", fg: "#1F6B3A", chip: "#1F6B3A" },
  warn: { bg: "#FBF3DF", border: "#EADFC4", fg: "#7A4C05", chip: "#A8741F" },
  bad: { bg: "#FBE8EA", border: "#F0C9CE", fg: "#B3001B", chip: "#B3001B" },
};

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF8F2] text-[#12213F]">
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">{children}</main>
    </div>
  );
}

function Card({ children, className = "" }) {
  return <section className={`rounded-3xl border border-[#E6DFC9] bg-white p-5 sm:p-7 ${className}`}>{children}</section>;
}

function Row({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F0EAD8] py-3.5 last:border-0">
      <dt className="text-[14px] text-[#5A6275]">{label}</dt>
      <dd className={`text-right text-[14.5px] font-semibold text-[#12213F] ${mono ? "font-mono tracking-wide" : ""}`}>{value}</dd>
    </div>
  );
}

function DocButton({ href, title, sub, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl border border-[#E6DFC9] bg-[#FAF8F2] p-4 transition-colors hover:border-[#A8741F] hover:bg-white"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#A8741F] ring-1 ring-[#E6DFC9]">
        <Icon size={22} stroke={1.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block text-[13px] text-[#5A6275]">{sub}</span>
      </span>
      <IconExternalLink size={18} className="shrink-0 text-[#8A90A3]" />
    </a>
  );
}

function Ingredient({ ing }) {
  return (
    <li className="rounded-2xl border border-[#E6DFC9] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15.5px] font-semibold leading-snug">{ing.name}</p>
        {ing.amount && <span className="shrink-0 rounded-full bg-[#FBF3DF] px-2.5 py-1 text-[12.5px] font-bold text-[#7A4C05]">{ing.amount}</span>}
      </div>
      {ing.description && <p className="mt-1.5 text-[14px] leading-relaxed text-[#4A5470]">{ing.description}</p>}
      {ing.origin && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#5A6275]">
          <IconMapPin size={14} className="text-[#A8741F]" /> Sourced from {ing.origin}
        </p>
      )}
    </li>
  );
}

export default function VerifyPage() {
  const { verificationCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => {
    if (!verificationCode) return;
    setLoading(true);
    setError(false);
    fetchApi(`/public/verify/${verificationCode}`)
      .then((r) => setData(r?.data?.verification || null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [verificationCode]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = () => {
    navigator.clipboard?.writeText(data.verificationCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  if (loading) {
    return (
      <Shell>
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-3xl bg-[#E6DFC9]/60" />
          <div className="h-80 rounded-3xl bg-[#E6DFC9]/60" />
          <div className="h-40 rounded-3xl bg-[#E6DFC9]/60" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Card className="text-center">
          <IconAlertTriangle className="mx-auto mb-3 h-10 w-10 text-[#A8741F]" />
          <h1 className="text-2xl font-semibold">We could not check this code</h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-[#4A5470]">The verification service is not reachable right now. Check your connection and try again.</p>
          <button onClick={load} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#12213F] px-6 text-[14px] font-semibold text-white hover:bg-[#B3001B]">
            <IconRefresh size={17} /> Try again
          </button>
        </Card>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <Card className="text-center">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[#FBE8EA]">
            <IconCircleX className="h-8 w-8 text-[#B3001B]" />
          </span>
          <h1 className="text-2xl font-semibold">We could not find this code</h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-[#4A5470]">
            This code is not in our records. If you bought this product, it may not be a genuine MWP product. Please contact us and send us a photo of the bottle.
          </p>
          <Link href="/contact" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#12213F] px-6 text-[14px] font-semibold text-white hover:bg-[#B3001B]">
            Contact us <IconArrowRight size={16} />
          </Link>
        </Card>
      </Shell>
    );
  }

  const meta = STATUS[data.status] || STATUS.INACTIVE;
  const authOk = data.authenticityStatus === "VERIFIED";
  // an active record whose authenticity could not be confirmed is shown as a caution, not as a green tick
  const tone = TONES[meta.tone === "ok" && !authOk ? "warn" : meta.tone];
  const Icon = meta.icon;
  const title = meta.tone === "ok" && !authOk ? "Record found, authenticity not confirmed" : meta.title;
  const text = meta.tone === "ok" && !authOk ? "This code exists in our records, but we have not confirmed its authenticity yet. Please contact us if you are unsure." : meta.text;

  const productImg = img(data.productImage);
  const badgeImg = img(data.badgeImage);
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const about = toParagraphs(data.description);
  const batch = [data.batchNumber, data.lotNumber].filter(Boolean);

  return (
    <Shell>
      {/* 1. The answer: is it genuine? */}
      <section className="rounded-3xl border p-5 sm:p-7" style={{ background: tone.bg, borderColor: tone.border }}>
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white shadow-sm" style={{ color: tone.fg }}>
            <Icon size={30} stroke={1.6} />
          </span>
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-tight sm:text-[26px]" style={{ color: tone.fg }}>{title}</h1>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#26314D]">{text}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5A6275]">Verification code</p>
            <p className="font-mono text-[17px] font-bold tracking-wider">{data.verificationCode}</p>
          </div>
          <button onClick={copy} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#12213F]/20 bg-white px-4 text-[13px] font-semibold hover:border-[#A8741F]">
            {copied ? <IconCheck size={15} className="text-[#1F6B3A]" /> : <IconCopy size={15} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      {/* 2. Which product */}
      <Card className="mt-4 overflow-hidden !p-0">
        <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#FBF5E6] via-white to-[#EEF1F8] sm:aspect-[16/10]">
          {productImg ? (
            <Image src={productImg} alt={data.productName} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain p-6 drop-shadow-[0_24px_28px_rgba(18,33,63,0.22)] sm:p-8" priority />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <span className="px-6 text-center text-3xl font-bold tracking-wide text-[#12213F]">{data.productName}</span>
            </div>
          )}
        </div>
        <div className="p-5 sm:p-7">
          <h2 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">{data.productName}</h2>
          {data.tagline && <p className="mt-1.5 text-[16px] font-semibold text-[#A8741F]">{data.tagline}</p>}
          {data.shortDescription && <p className="mt-3 text-[15.5px] leading-relaxed text-[#26314D]">{data.shortDescription}</p>}

          {data.features?.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {data.features.map((f, i) => (
                <li key={i} className="rounded-full border border-[#D4A437]/60 bg-[#FBF5E6] px-3.5 py-1.5 text-[13px] font-semibold text-[#7A4C05]">{f}</li>
              ))}
            </ul>
          )}

          {data.productSlug && (
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
              <Link href={`/products/${data.productSlug}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#12213F] px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#B3001B]">
                Shop {data.productName} <IconArrowRight size={17} />
              </Link>
              <Link href="/products" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#12213F]/20 px-6 text-[14.5px] font-semibold hover:border-[#A8741F] hover:text-[#A8741F]">
                See all formulas
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* 3. The facts on this bottle */}
      <Card className="mt-4">
        <h2 className="text-[20px] font-bold">Details for this bottle</h2>
        <p className="mt-1 text-[14px] text-[#5A6275]">Compare these with the label on your bottle.</p>
        <dl className="mt-3">
          <Row label="Authenticity" value={authOk ? "Verified" : data.authenticityStatus === "UNVERIFIED" ? "Not verified" : "Not available"} />
          <Row label="Batch number" value={data.batchNumber} mono />
          <Row label="Lot number" value={data.lotNumber} mono />
          <Row label="Manufactured" value={formatDate(data.manufacturingDate)} />
          <Row label="Best before" value={formatDate(data.expiryDate)} />
          <Row label="Made in" value={data.origin} />
          {badgeImg || data.badgeType ? <Row label="Quality mark" value={data.badgeType} /> : null}
        </dl>
        {batch.length === 0 && !data.manufacturingDate && !data.expiryDate && (
          <p className="mt-2 rounded-2xl bg-[#FAF8F2] px-4 py-3 text-[13.5px] leading-relaxed text-[#5A6275]">
            Batch and date details for this product are not listed yet. Your bottle label has the lot number and best-before date.
          </p>
        )}
        {badgeImg && (
          <div className="mt-4 flex items-center gap-3">
            <span className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-[#D4A437]">
              <Image src={badgeImg} alt={data.badgeType || "Quality badge"} fill sizes="56px" className="object-cover" />
            </span>
            {data.badgeType && <span className="text-[14px] font-semibold">{data.badgeType}</span>}
          </div>
        )}
      </Card>

      {/* 4. Lab reports */}
      {(data.coaUrl || data.certificateUrl) && (
        <Card className="mt-4">
          <h2 className="text-[20px] font-bold">Lab reports and certificates</h2>
          <p className="mt-1 text-[14px] text-[#5A6275]">Independent test results for this product.</p>
          <div className="mt-4 grid gap-3">
            {data.coaUrl && <DocButton href={data.coaUrl} title="Certificate of Analysis (COA)" sub="Open the lab report" icon={IconFlask} />}
            {data.certificateUrl && <DocButton href={data.certificateUrl} title="Certificate" sub="Open the document" icon={IconFileCertificate} />}
          </div>
        </Card>
      )}

      {/* 5. What is inside */}
      {ingredients.length > 0 && (
        <Card className="mt-4">
          <h2 className="flex items-center gap-2 text-[20px] font-bold"><IconLeaf size={22} className="text-[#A8741F]" /> What&apos;s inside</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5A6275]">Each ingredient, the amount in a serving, and where it comes from.</p>
          <ul className="mt-4 grid gap-3">
            {ingredients.map((ing, i) => <Ingredient key={i} ing={ing} />)}
          </ul>
        </Card>
      )}

      {/* 6. About */}
      {about.length > 0 && (
        <Card className="mt-4">
          <h2 className="text-[20px] font-bold">About this product</h2>
          <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#26314D]">
            {about.map((t, i) => <p key={i}>{t}</p>)}
          </div>
        </Card>
      )}

      {/* 7. Help */}
      <p className="mt-6 text-center text-[13.5px] leading-relaxed text-[#5A6275]">
        Something does not look right? <Link href="/contact" className="font-semibold text-[#12213F] underline underline-offset-4">Contact us</Link>.
        <br />
        This page confirms that the code above was issued by MWP Supplements.
      </p>
    </Shell>
  );
}
