import Link from "next/link";
import { RefreshCw, Video, ShieldAlert, Mail } from "lucide-react";

export const metadata = {
  title: "Returns & Refund Policy | MWP SUPPLEMENTS",
  description: "Review MWP SUPPLEMENTS Returns, Replacement & Quality Guarantee terms, unboxing verification guidelines, and hygiene protocols.",
};

const returnSteps = [
  {
    step: 1,
    title: "Unboxing Video",
    description: "Record uninterrupted unboxing video showing outer label and tamper seal before opening."
  },
  {
    step: 2,
    title: "Report Within 48 Hours",
    description: "Submit video and order ID to support@mwpsupplements.com."
  },
  {
    step: 3,
    title: "Quality Review",
    description: "Our QA laboratory evaluates transit damage, broken seals, or dispatch issues."
  },
  {
    step: 4,
    title: "Priority Replacement",
    description: "Approved replacements are expedited with priority air express courier."
  }
];

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Banner Header ── */}
      <section className="relative py-14 md:py-20 overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-red-500 font-medium">Returns Policy</span>
          </div>
          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-red-600/10 border border-red-500/30 text-red-500 text-xs font-bold tracking-wider uppercase">
            CLINICAL INTEGRITY &amp; HYGIENE STANDARDS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">
            Returns &amp; Replacement Policy
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            Because MWP supplements are high-potency nutritional consumables, strict safety protocols protect all athletes and customers.
          </p>
        </div>
      </section>

      {/* ── Policy Content ── */}
      <section className="py-12 md:py-16 px-6 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Return Workflow Grid */}
          <div className="bg-[#121212] rounded-3xl p-8 border border-white/10 shadow-2xl">
            <h2 className="text-xl md:text-2xl text-white mb-6 text-center flex items-center justify-center gap-2 font-bold">
              <RefreshCw className="w-5 h-5 text-red-500" /> Replacement &amp; Claim Process
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {returnSteps.map((item) => (
                <div key={item.step} className="text-center relative bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-red-600/10 text-red-500 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-base">
                    {item.step}
                  </div>
                  <h3 className="text-white text-xs font-bold mb-1">{item.title}</h3>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Prose Body */}
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl space-y-8 text-neutral-300">

            <div className="border-b border-white/10 pb-6">
              <p className="text-sm md:text-base leading-relaxed text-neutral-200">
                At <strong className="text-white font-bold">MWP SUPPLEMENTS</strong>, every bottle of Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy, and Daily Boost is packaged under strict clean-room GMP standards. Due to the ingestible nature of health supplements, government health regulations, and hygiene considerations, we follow an uncompromising safety policy.
              </p>
            </div>

            {/* Non-Returnable Category */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-white">
                Hygiene &amp; Safety Notice
              </h2>
              <p className="text-sm font-semibold text-red-400 bg-red-950/40 p-3.5 rounded-xl border border-red-800/40">
                For health and food safety reasons under FSSAI consumer protection norms, opened or unsealed dietary supplement containers are non-returnable.
              </p>
              <p className="text-xs text-neutral-400 font-medium">Returns are NOT accepted for:</p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs text-neutral-300 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <li>• Change of mind or taste/flavor preference</li>
                <li>• Personal fitness routine adjustments</li>
                <li>• Incorrect product variant chosen by customer</li>
                <li>• Opened, unsealed, or partially consumed containers</li>
                <li>• Products purchased during special clearance sales</li>
                <li>• Failure to store in recommended cool, dry conditions</li>
              </ul>
            </div>

            {/* Replacements */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white">
                When Do We Replace Free of Cost?
              </h2>
              <p className="text-sm text-neutral-400">We immediately dispatch a fresh replacement if:</p>
              <ul className="space-y-1 text-xs text-neutral-300 list-disc pl-5 font-medium">
                <li>The shipment arrived damaged, crushed, or leaking during transit.</li>
                <li>The factory tamper-evident safety seal was compromised upon initial delivery.</li>
                <li>An incorrect product or formula variant was dispatched by our warehouse.</li>
              </ul>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-semibold">
                All damage or wrong item replacement requests must be reported within 48 hours of delivery along with unboxing video proof.
              </div>
            </div>

            {/* Mandatory Unboxing Video */}
            <div className="space-y-3 pt-4 border-t border-white/10 p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-red-500" />
                Mandatory Unboxing Video
              </h2>
              <p className="text-xs text-neutral-300 leading-relaxed">
                To eliminate fraudulent courier tampering and verify product integrity, a continuous, uncut unboxing video is required.
              </p>
              <p className="text-xs text-red-400 font-bold">The video must show:</p>
              <ul className="space-y-1.5 text-xs text-neutral-400 list-disc pl-5">
                <li>The shipping label with AWB and recipient address prior to box opening.</li>
                <li>Full 360-degree view of outer parcel condition before cutting any tape.</li>
                <li>Unbroken recording until the product bottle and safety seal are clearly visible.</li>
              </ul>
            </div>

            {/* Refunds */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <h3 className="font-bold text-white text-base">Refund Policy</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Where an approved replacement item is temporarily out of stock or transit is unfulfillable, a 100% refund is initiated back to your original payment mode within 5–7 business days.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-white text-base">Order Cancellations</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Orders may be cancelled free of charge prior to warehouse packaging and AWB generation by contacting support@mwpsupplements.com immediately.
                </p>
              </div>
            </div>

            {/* Fraud Prevention */}
            <div className="space-y-2 pt-4 border-t border-white/10 p-4 bg-red-950/30 border border-red-800/40 rounded-2xl">
              <h3 className="font-bold text-red-300 text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Anti-Fraud Safeguards
              </h3>
              <p className="text-xs text-red-200/80 leading-relaxed">
                MWP SUPPLEMENTS reserves the right to deny replacement requests that lack valid video verification or show signs of intentional tampering. Suspicious claim patterns will be referred to our logistics audit team.
              </p>
            </div>

            {/* Support Concierge */}
            <div className="pt-6 border-t border-white/10 bg-white/[0.02] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  Have Questions Regarding A Replacement?
                </h3>
                <p className="text-xs text-neutral-400">
                  Our customer support team will assist you through claim filing and replacement tracking.
                </p>
                <p className="text-xs font-medium text-neutral-200 mt-1">
                  Email: <a href="mailto:support@mwpsupplements.com" className="text-red-400 underline">support@mwpsupplements.com</a>
                </p>
              </div>
              <a
                href="mailto:support@mwpsupplements.com"
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all text-center shrink-0 shadow-lg shadow-red-900/30"
              >
                File A Claim
              </a>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
