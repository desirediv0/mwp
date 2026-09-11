"use client";

import { useState } from "react";
import { IconMail, IconArrowRight, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/utils";
import Reveal from "@/components/ui/Reveal";

export default function JoinTheCultSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetchApi("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });

      if (res?.success) {
        setSubscribed(true);
        toast.success("Welcome to the Cult! Check your inbox for exclusive updates.");
      } else {
        toast.error(res?.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      toast.error(err?.data?.message || err?.message || "Subscription failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-noir text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-5 md:px-8 text-center relative z-10">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.3em] font-medium block mb-4 text-gold">
            Exclusive Membership
          </span>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Join the <em className="italic text-gold">Cult</em>
          </h2>

          <p className="text-white/60 text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed mb-10">
            Unlock priority access to limited edition launches, secret sample releases, and private olfactory invitations.
          </p>

          {subscribed ? (
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gold/10 border border-gold/40 rounded-lg text-gold text-sm font-medium">
              <IconCheck className="w-5 h-5 text-gold" />
              Thank you for subscribing! Check your inbox for exclusive updates.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/15 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gold text-noir font-medium text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-gold-light disabled:bg-gold/60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    Subscribe
                    <IconArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
