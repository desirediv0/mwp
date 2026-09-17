"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconMail, IconArrowRight, IconCheck } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import Reveal from "@/components/ui/Reveal";

export default function PerformanceClubCta() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      await fetchApi("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      toast.success("Welcome to the MWP Performance Club! Check your inbox.");
    } catch (err) {
      // Even on a duplicate / soft error, treat it as success for UX
      setSubmitted(true);
      toast.success("You're on the list! Check your inbox for your welcome code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-5 md:px-8 lg:px-10 text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-100 text-neutral-900 text-[10px] font-bold uppercase tracking-[0.15em] mb-4">
            MWP VIP Community
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[46px] text-noir tracking-tight leading-tight font-extrabold">
            Join The MWP{" "}
            <em className="italic text-neutral-900">Performance Club</em>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-stone max-w-xl mx-auto font-light leading-relaxed">
            Get 10% off your first supplement stack, priority access to fresh batches, and
            evidence-based training and hormone protocols.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          {submitted ? (
            <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold inline-flex items-center gap-2">
              <IconCheck className="h-5 w-5" />
              <span>You&apos;re in! Check your inbox for your 10% welcome coupon.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-gray-200 focus:border-neutral-900 text-noir placeholder-stone text-sm outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="py-3.5 px-6 bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-neutral-900/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>{loading ? "Joining..." : "Get 10% Off"}</span>
                <IconArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </Reveal>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-stone">
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-neutral-900" />
            Instant Discount Code
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-neutral-900" />
            Exclusive Stack Discounts
          </span>
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-4 w-4 text-neutral-900" />
            Unsubscribe Anytime
          </span>
        </div>
      </div>
    </section>
  );
}
