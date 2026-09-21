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
  IconMapPin,
  IconCalendar,
  IconRefresh,
  IconShoppingBag,
  IconExternalLink,
  IconArrowRight,
} from "@tabler/icons-react";

const img = (raw) => {
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

const formatDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return null;
  }
};

const STATUS_META = {
  ACTIVE: {
    icon: IconShieldCheck,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "PRODUCT VERIFIED",
    sub: "This product record is currently active and authentic.",
  },
  INACTIVE: {
    icon: IconAlertTriangle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "VERIFICATION UNAVAILABLE",
    sub: "This verification record is currently inactive.",
  },
  EXPIRED: {
    icon: IconAlertTriangle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "PRODUCT RECORD EXPIRED",
    sub: "The verification record has expired.",
  },
  SUSPENDED: {
    icon: IconAlertTriangle,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "VERIFICATION SUSPENDED",
    sub: "This product verification is currently suspended.",
  },
  REVOKED: {
    icon: IconCircleX,
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "VERIFICATION REVOKED",
    sub: "This verification record is no longer valid.",
  },
};

function IngredientRow({ ing }) {
  return (
    <div className="rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-[15px] sm:text-base text-[#1a1a1a] leading-snug">{ing.name}</p>
        {ing.amount && (
          <span className="shrink-0 text-[13px] font-bold text-[#8a6d1f] whitespace-nowrap">{ing.amount}</span>
        )}
      </div>
      {ing.description && (
        <p className="text-[12.5px] text-[#6b6045] mt-1.5 leading-relaxed">{ing.description}</p>
      )}
      {ing.origin && (
        <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#8a6d1f] mt-2.5">
          Origin &middot; {ing.origin}
        </p>
      )}
    </div>
  );
}

function TapCard({ label, value, onClick, href }) {
  const content = (
    <>
      <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-[#8a6d1f]">{label}</p>
      <p className="text-[12px] text-[#6b6045] mt-1">{value}</p>
    </>
  );
  const className =
    "rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] hover:border-[#c9a44c] hover:bg-white transition-colors p-5 text-center cursor-pointer";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function VerifyPage() {
  const { verificationCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const load = useCallback(() => {
    if (!verificationCode) return;
    setLoading(true);
    setError(false);
    fetchApi(`/public/verify/${verificationCode}`)
      .then((r) => {
        setData(r?.data?.verification || null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [verificationCode]);

  useEffect(() => {
    load();
  }, [load]);

  /* -------------------- loading -------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F2E7] flex items-center justify-center px-5">
        <div className="w-full max-w-md space-y-4 animate-pulse">
          <div className="h-8 w-40 bg-[#e7ddc8] rounded mx-auto" />
          <div className="h-48 w-full bg-[#e7ddc8] rounded-2xl mx-auto" />
          <div className="h-6 w-3/4 bg-[#e7ddc8] rounded mx-auto" />
          <div className="h-4 w-1/2 bg-[#e7ddc8] rounded mx-auto" />
        </div>
      </div>
    );
  }

  /* -------------------- api failure -------------------- */
  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F2E7] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <IconAlertTriangle className="h-10 w-10 text-amber-600 mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-[#1a1a1a] mb-2">Verification Service Temporarily Unavailable</h1>
          <p className="text-[#6b6045] text-sm mb-6">Please check your connection and try again.</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d1b2a] text-white text-[12px] uppercase tracking-wider font-bold hover:bg-[#16283d] transition-colors"
          >
            <IconRefresh className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- not found -------------------- */
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F2E7] flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#fbe9e9] flex items-center justify-center mx-auto mb-5">
            <IconCircleX className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="font-serif text-2xl text-[#1a1a1a] mb-2">Verification Not Found</h1>
          <p className="text-[#6b6045] text-sm mb-6">
            We couldn&apos;t find a valid product verification record for this QR code.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0d1b2a] text-white text-[12px] uppercase tracking-wider font-bold hover:bg-[#16283d] transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const meta = STATUS_META[data.status] || STATUS_META.INACTIVE;
  const StatusIcon = meta.icon;
  const productImg = img(data.productImage);
  const badgeImg = img(data.badgeImage);
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];

  return (
    <div className="min-h-screen bg-[#F7F2E7] py-6 md:py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-[#e7ddc8] shadow-[0_20px_60px_-25px_rgba(13,27,42,0.15)] overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 md:px-10 py-6 border-b border-[#f0ead8]">
          <div>
            <p className="font-serif tracking-[0.25em] text-xl md:text-2xl text-[#1a1a1a]">MWP</p>
            <p className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-[#8a6d1f] font-bold mt-0.5">
              Men &bull; Women &bull; Power
            </p>
          </div>
          {data.productSlug && (
            <Link
              href={`/products/${data.productSlug}`}
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#c9a44c] text-[#0d1b2a] text-[11px] uppercase tracking-wider font-bold hover:bg-[#ddb960] transition-colors whitespace-nowrap"
            >
              Order Now
            </Link>
          )}
        </header>

        {/* HERO */}
        <div className="overflow-hidden">
          <div className="grid md:grid-cols-[minmax(0,1fr)_1.3fr] gap-8 md:gap-10 p-6 md:p-10">
            {/* Product image */}
            <div className="relative w-full aspect-[5/4] rounded-2xl overflow-hidden bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A] border border-[#e7ddc8]">
              {productImg ? (
                <Image
                  src={productImg}
                  alt={data.productName}
                  fill
                  sizes="(max-width:768px) 100vw, 420px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-[#c9a44c] text-2xl tracking-wide px-6 text-center border border-[#c9a44c]/40 rounded-xl py-8">
                    {data.productName}
                  </span>
                </div>
              )}
            </div>

            {/* Hero copy */}
            <div className="flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a44c] font-bold mb-3">
                Men &bull; Women &bull; Power
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#1a1a1a] leading-[1.05]">
                {data.productName}
              </h1>
              {data.tagline && (
                <p className="mt-4 text-[15px] sm:text-base font-semibold text-[#1a1a1a]">{data.tagline}</p>
              )}
              {data.shortDescription && (
                <p className="mt-2 text-[13.5px] sm:text-[14px] text-[#6b6045] leading-relaxed">
                  {data.shortDescription}
                </p>
              )}

              {data.features?.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {data.features.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] uppercase tracking-wide font-bold text-[#8a6d1f] border border-[#c9a44c]/50 rounded-full px-3.5 py-1.5"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border ${meta.bg} ${meta.border} w-fit`}
              >
                <StatusIcon className={`h-5 w-5 ${meta.color}`} />
                <span className={`text-[12px] font-bold tracking-wide ${meta.color}`}>{meta.label}</span>
              </div>

              {data.productSlug && (
                <Link
                  href={`/products/${data.productSlug}`}
                  className="mt-6 inline-flex items-center gap-2 w-fit px-7 py-3 rounded-full bg-[#c9a44c] text-[#0d1b2a] text-[12px] uppercase tracking-wider font-bold hover:bg-[#ddb960] transition-colors"
                >
                  Discover {data.productName} <IconArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* WHAT'S INSIDE */}
        {ingredients.length > 0 && (
          <div className="px-6 md:px-10 py-9 border-t border-[#f0ead8]">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#1a1a1a] mb-1.5">What&apos;s Inside</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#c9a44c] mb-1.5">
              World-Class Ingredients. Globally Sourced.
            </p>
            <p className="text-[13px] text-[#6b6045] max-w-2xl mb-6">
              {data.productName} brings together carefully selected ingredients from trusted sources
              around the world, chosen for quality, purpose and their role in the formula.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {ingredients.map((ing, i) => (
                <IngredientRow key={i} ing={ing} />
              ))}
            </div>
          </div>
        )}

        {/* VERIFY YOUR PRODUCT */}
        <div className="px-6 md:px-10 py-9 border-t border-[#f0ead8]">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1a1a1a] mb-6 text-center">
            Verify Your Product
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <TapCard
              label="Batch / Lot"
              value={showBatch ? [data.batchNumber, data.lotNumber].filter(Boolean).join(" / ") || "—" : "Display current lot details"}
              onClick={() => setShowBatch((s) => !s)}
            />
            <TapCard
              label="Authenticity"
              value={
                showAuth
                  ? data.authenticityStatus === "VERIFIED"
                    ? "Verified"
                    : data.authenticityStatus
                  : "Product verification status"
              }
              onClick={() => setShowAuth((s) => !s)}
            />
            <TapCard
              label="Approved COA"
              value={data.coaUrl ? "Tap to view available report" : "No report available"}
              href={data.coaUrl || undefined}
            />
          </div>

          {(data.manufacturingDate || data.expiryDate || data.origin) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
              {data.manufacturingDate && (
                <div className="rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#8a6d1f] mb-1.5">
                    <IconCalendar className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.16em] font-bold">Manufactured</span>
                  </div>
                  <p className="text-[13px] text-[#1a1a1a] font-serif">{formatDate(data.manufacturingDate)}</p>
                </div>
              )}
              {data.expiryDate && (
                <div className="rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#8a6d1f] mb-1.5">
                    <IconCalendar className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.16em] font-bold">Expiry</span>
                  </div>
                  <p className="text-[13px] text-[#1a1a1a] font-serif">{formatDate(data.expiryDate)}</p>
                </div>
              )}
              {data.origin && (
                <div className="rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] p-5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[#8a6d1f] mb-1.5">
                    <IconMapPin className="h-3.5 w-3.5" />
                    <span className="text-[11px] uppercase tracking-[0.16em] font-bold">Origin</span>
                  </div>
                  <p className="text-[13px] text-[#1a1a1a] font-serif">{data.origin}</p>
                </div>
              )}
            </div>
          )}

          {data.certificateUrl && (
            <a
              href={data.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 flex items-center justify-between rounded-2xl border border-[#c9a44c]/40 bg-gradient-to-br from-[#fdf8ec] to-[#f7ead0] px-5 py-4 hover:border-[#c9a44c] transition-colors"
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a6d1f]">
                  Certificate
                </span>
                <span className="block text-[#0d1b2a] font-serif text-[15px] mt-0.5">View Document</span>
              </span>
              <IconExternalLink className="h-4 w-4 text-[#8a6d1f] shrink-0" />
            </a>
          )}

          {/* Description */}
          {data.description && (
            <div className="mt-6 pt-6 border-t border-[#f0ead8]">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a6d1f] mb-2">
                Product Information
              </p>
              <p className="text-[#3a3325] text-[14px] leading-relaxed">{data.description}</p>
            </div>
          )}

          {/* Badge */}
          {badgeImg && (
            <div className="mt-6 pt-6 border-t border-[#f0ead8] flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#c9a44c]">
                <Image src={badgeImg} alt={data.badgeType || "Certification badge"} fill sizes="64px" className="object-cover" />
              </div>
              {data.badgeType && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a6d1f] font-bold mt-2">
                  {data.badgeType}
                </p>
              )}
            </div>
          )}

          <p className="mt-7 text-center text-[10px] uppercase tracking-[0.16em] text-[#a89968]">
            MWP &middot; Men &bull; Women &bull; Power &middot; Product Information
          </p>
        </div>
      </div>

      {/* CTA */}
      {data.productSlug && (
        <div className="max-w-5xl mx-auto mt-6">
          <div className="rounded-2xl bg-[#0d1b2a] text-[#F7F2E7] p-7 sm:p-9 text-center">
            <h3 className="font-serif text-xl sm:text-2xl">{data.productName}</h3>
            <p className="text-[#c9c2ab] text-[13px] mt-2 max-w-md mx-auto">
              Experience the same product, verified and trusted.
            </p>
            <Link
              href={`/products/${data.productSlug}`}
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#c9a44c] text-[#0d1b2a] text-[12px] uppercase tracking-wider font-bold hover:bg-[#ddb960] transition-colors"
            >
              <IconShoppingBag className="h-4 w-4" /> Buy Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
