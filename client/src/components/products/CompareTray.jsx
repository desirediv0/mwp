"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { X, GitCompareArrows, ArrowRight, Plus } from "lucide-react";
import { useCompare } from "@/lib/compare-context";
import { productPalette } from "@/lib/product-palette";

const imageUrl = raw => {
  if (raw && typeof raw === "object") raw = raw.url || raw.image;
  if (typeof raw !== "string") return "/placeholder.jpg";
  if (!raw) return "/placeholder.jpg";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

export function CompareTray() {
  const { items, count, max, removeFromCompare, clearCompare } = useCompare();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  if (pathname === "/compare" || count === 0) return null;

  return (
    <motion.aside
      aria-label="Selected formulas to compare"
      initial={reducedMotion ? false : { y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] px-3 sm:px-6"
    >
      <div className="pointer-events-auto mx-auto max-w-[960px] rounded-2xl border border-neutral-200 bg-white/95 p-3 shadow-[0_12px_50px_-14px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700"><GitCompareArrows size={18} /></span>
            <div>
              <p className="text-sm text-neutral-900">Your formula comparison</p>
              <p className="text-[11px] text-neutral-500">{count} of {max} selected{count === 1 ? " · Choose one more to compare" : " · Ready to compare side by side"}</p>
            </div>
          </div>
          <button onClick={clearCompare} className="min-h-10 shrink-0 whitespace-nowrap rounded-lg px-2 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-green-700">Clear all</button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {items.map(product => (
              <div key={product.id} className="relative flex shrink-0 items-center rounded-xl border border-neutral-200 pr-9" style={{ background: productPalette(product.slug).background }}>
                <Link href={`/products/${product.slug}`} className="flex min-h-14 items-center gap-2 px-2 py-1 focus-visible:outline-green-700">
                  <span className="relative h-11 w-7 shrink-0"><Image src={imageUrl(product.image)} alt="" fill sizes="28px" className="object-contain" /></span>
                  <span className="max-w-[95px] text-[11px] leading-4 text-neutral-800">{product.name.replace(/[\u2122\u00ae]/g, "")}</span>
                </Link>
                <button onClick={() => removeFromCompare(product.id)} aria-label={`Remove ${product.name} from comparison`} className="absolute right-0 top-1/2 flex h-10 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 focus-visible:outline-green-700"><X size={14} /></button>
              </div>
            ))}
            {count < max && <Link href="/products" aria-label="Add another formula to compare" className="flex min-h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-300 text-green-700 hover:bg-green-50"><Plus size={18} /></Link>}
          </div>
          <Link href={count < 2 ? "/products" : "/compare"} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-neutral-900 px-5 text-xs text-white transition-colors hover:bg-green-800 focus-visible:outline-green-700">
            {count < 2 ? "Choose another formula" : `Compare ${count} formulas`} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </motion.aside>
  );
}
export default CompareTray;
