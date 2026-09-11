"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconMail, IconArrowRight, IconCheck } from "@tabler/icons-react";

export default function MwpCtaSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubmitted(true);
    toast.success("Welcome to the MWP Performance Club! Check your inbox.");
  };

  return (
    <section className="py-20 bg-gradient-to-b from-[#09090b] to-[#141418] text-white border-t border-white/[0.08] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/30 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
          MWP VIP Community
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight">
          JOIN THE MWP <span className="bg-gradient-to-r from-red-500 via-rose-400 to-red-600 bg-clip-text text-transparent">PERFORMANCE CLUB</span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
          Get 10% off your first supplement stack, priority access to fresh batches, and evidence-based training and hormone protocols.
        </p>

        {submitted ? (
          <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold inline-flex items-center gap-2">
            <IconCheck className="h-5 w-5" />
            <span>You&apos;re in! Check your inbox for your 10% welcome coupon.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3.5 rounded-lg bg-white/[0.06] border border-white/15 focus:border-red-500 text-white placeholder-slate-400 text-sm outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              className="py-3.5 px-6 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Get 10% Off</span>
              <IconArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-red-500" />
            Instant Discount Code
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-red-500" />
            Exclusive Stack Discounts
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-red-500" />
            Unsubscribe Anytime
          </span>
        </div>
      </div>
    </section>
  );
}
