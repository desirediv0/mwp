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
  IconCertificate,
  IconFileText,
  IconMapPin,
  IconCalendar,
  IconRefresh,
  IconShoppingBag,
  IconExternalLink,
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

function StatCard({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-[#e7ddc8] bg-[#FBF6EA] p-5">
      <div className="flex items-center gap-2 text-[#8a6d1f] mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold">{label}</span>
      </div>
      <p className="text-[#1a1a1a] font-serif text-lg">{value}</p>
    </div>
  );
}

export default function VerifyPage() {
  const { verificationCode } = useParams();
  const [data, setData] = useState(null);
  const [verified, setVerified] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!verificationCode) return;
    setLoading(true);
    setError(false);
    fetchApi(`/public/verify/${verificationCode}`)
      .then((r) => {
        setVerified(!!r?.data?.verified);
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
          <div className="h-48 w-48 bg-[#e7ddc8] rounded-2xl mx-auto" />
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

  return (
    <div className="min-h-screen bg-[#F7F2E7]">
      {/* Header */}
      <header className="bg-[#0d1b2a] text-[#F7F2E7]">
        <div className="max-w-3xl mx-auto px-5 py-8 text-center">
          <p className="font-serif tracking-[0.3em] text-2xl md:text-3xl">MWP</p>
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.35em] text-[#c9a44c] mt-1.5">
            Men &bull; Women &bull; Power
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10 md:py-14">
        {/* Trust statement */}
        <div className="text-center mb-9">
          <p className="font-serif italic text-[#0d1b2a] text-xl md:text-2xl leading-snug">
            &ldquo;Proof Before Promises.&rdquo;
          </p>
          <p className="text-[#6b6045] text-[13px] md:text-sm mt-2 max-w-md mx-auto">
            What goes into your body should earn your trust.
          </p>
        </div>

        {/* Verification card */}
        <div className="rounded-3xl bg-white border border-[#e7ddc8] shadow-[0_20px_60px_-25px_rgba(13,27,42,0.25)] overflow-hidden">
          {/* Product */}
          <div className="p-6 md:p-9 text-center border-b border-[#f0ead8]">
            <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto rounded-2xl overflow-hidden bg-[#F7F2E7] border border-[#e7ddc8] mb-5">
              {productImg ? (
                <Image src={productImg} alt={data.productName} fill sizes="128px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c9a44c]">
                  <IconShieldCheck className="h-10 w-10" />
                </div>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#c9a44c] font-bold mb-1.5">
              Product Verification
            </p>
            <h1 className="font-serif text-2xl md:text-3xl text-[#0d1b2a]">{data.productName}</h1>

            <div
              className={`mt-5 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border ${meta.bg} ${meta.border}`}
            >
              <StatusIcon className={`h-5 w-5 ${meta.color}`} />
              <span className={`text-[12px] md:text-sm font-bold tracking-wide ${meta.color}`}>{meta.label}</span>
            </div>
            <p className="text-[#6b6045] text-[13px] mt-2 max-w-sm mx-auto">{meta.sub}</p>
          </div>

          {/* Details grid */}
          <div className="p-6 md:p-9 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <StatCard icon={IconShieldCheck} label="Verification ID" value={data.verificationCode} />
            <StatCard
              icon={IconFileText}
              label="Batch / Lot"
              value={[data.batchNumber, data.lotNumber].filter(Boolean).join(" / ") || null}
            />
            <StatCard icon={IconCalendar} label="Manufacturing Date" value={formatDate(data.manufacturingDate)} />
            <StatCard icon={IconCalendar} label="Expiry Date" value={formatDate(data.expiryDate)} />
            <StatCard
              icon={IconShieldCheck}
              label="Authenticity Status"
              value={data.authenticityStatus === "VERIFIED" ? "Verified" : data.authenticityStatus}
            />
            <StatCard icon={IconMapPin} label="Origin / Source" value={data.origin} />
          </div>

          {/* COA / Certificate */}
          {(data.coaUrl || data.certificateUrl) && (
            <div className="px-6 md:px-9 pb-6 md:pb-9 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.coaUrl && (
                <a
                  href={data.coaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-[#c9a44c]/40 bg-gradient-to-br from-[#fdf8ec] to-[#f7ead0] px-5 py-4 hover:border-[#c9a44c] transition-colors"
                >
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a6d1f]">
                      Approved COA
                    </span>
                    <span className="block text-[#0d1b2a] font-serif text-[15px] mt-0.5">View Certificate</span>
                  </span>
                  <IconExternalLink className="h-4 w-4 text-[#8a6d1f] shrink-0" />
                </a>
              )}
              {data.certificateUrl && (
                <a
                  href={data.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-[#c9a44c]/40 bg-gradient-to-br from-[#fdf8ec] to-[#f7ead0] px-5 py-4 hover:border-[#c9a44c] transition-colors"
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
            </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="px-6 md:px-9 pb-6 md:pb-9">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a6d1f] mb-2">
                Product Information
              </p>
              <p className="text-[#3a3325] text-[14px] leading-relaxed">{data.description}</p>
            </div>
          )}

          {/* Ingredients */}
          {data.ingredients?.length > 0 && (
            <div className="px-6 md:px-9 pb-6 md:pb-9">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8a6d1f] mb-3">Ingredients</p>
              <div className="flex flex-wrap gap-2">
                {data.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-[12px] px-3 py-1.5 rounded-full bg-[#F7F2E7] border border-[#e7ddc8] text-[#3a3325]"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Badge */}
          {badgeImg && (
            <div className="px-6 md:px-9 pb-8 md:pb-10 flex flex-col items-center border-t border-[#f0ead8] pt-7">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#c9a44c]">
                <Image src={badgeImg} alt={data.badgeType || "Certification badge"} fill sizes="80px" className="object-cover" />
              </div>
              {data.badgeType && (
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8a6d1f] font-bold mt-2.5">
                  {data.badgeType}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trust footer badges */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { icon: IconShieldCheck, label: "Verified Product" },
            { icon: IconCertificate, label: "Authenticity" },
            { icon: IconFileText, label: "Batch / Lot" },
            { icon: IconCertificate, label: "Certificate / COA" },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="rounded-xl border border-[#e7ddc8] bg-white/60 py-4 px-2">
              <Icon className="h-5 w-5 text-[#c9a44c] mx-auto mb-1.5" />
              <p className="text-[10px] uppercase tracking-wide text-[#6b6045] font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        {data.productSlug && (
          <div className="mt-10 rounded-2xl bg-[#0d1b2a] text-[#F7F2E7] p-7 sm:p-9 text-center">
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
        )}
      </div>
    </div>
  );
}
