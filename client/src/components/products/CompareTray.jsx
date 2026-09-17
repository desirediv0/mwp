"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitCompareArrows, ArrowRight } from "lucide-react";
import { useCompare } from "@/lib/compare-context";

const img = (raw) => {
  if (!raw) return "/placeholder.jpg";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

export function CompareTray() {
  const { items, count, max, removeFromCompare, clearCompare } = useCompare();
  const pathname = usePathname();

  if (pathname === "/compare" || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 140, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 140, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed bottom-4 sm:bottom-6 inset-x-0 z-[60] px-3 sm:px-5 pointer-events-none"
      >
        <div className="pointer-events-auto max-w-3xl mx-auto bg-gradient-to-br from-[#141416] to-[#0c0c0e] border border-white/10 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* top accent */}
          <div className="h-1 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900" />

          <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3">
            {/* label */}
            <div className="hidden sm:flex flex-col shrink-0 pr-4 border-r border-white/10">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-extrabold text-white">
                <GitCompareArrows className="h-4 w-4 text-neutral-900" />
                Compare
              </span>
              <span className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                {count} of {max} selected
              </span>
            </div>

            {/* thumbnails */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 overflow-hidden bg-white/5 border border-white/10 hover:border-neutral-500/50 transition-colors"
                  title={p.name}
                >
                  <Image src={img(p.image)} alt={p.name} fill className="object-cover" sizes="48px" />
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromCompare(p.id); }}
                    className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </Link>
              ))}
              {[...Array(Math.max(0, max - count))].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 border border-dashed border-white/12"
                />
              ))}
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearCompare}
                className="hidden sm:inline-flex items-center px-3 py-2 text-[11px] uppercase tracking-wider font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Clear
              </button>
              <Link
                href="/compare"
                className={`inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 text-[11px] sm:text-[12px] uppercase tracking-wider font-extrabold transition-all ${
                  count < 2
                    ? "bg-white/10 text-neutral-400 pointer-events-none"
                    : "bg-gradient-to-r from-neutral-900 to-neutral-800 text-white hover:from-neutral-800 hover:to-neutral-700 shadow-lg shadow-neutral-900/30"
                }`}
              >
                {count < 2 ? "Add 1 more" : "Compare Now"}
                {count >= 2 && <ArrowRight className="h-4 w-4" />}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CompareTray;
