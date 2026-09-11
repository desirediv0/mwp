import Link from "next/link";
import { Mail, Clock, MapPin, Truck, AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Shipping & Delivery Policy | MWP SUPPLEMENTS",
  description: "Learn about MWP SUPPLEMENTS order processing timelines, pan-India delivery coverage, tamper-evident packaging, tracking updates, and shipping terms.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Banner Header ── */}
      <section className="relative py-14 md:py-20 overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-red-500 font-medium">Shipping Policy</span>
          </div>
          <div className="inline-block px-3 py-1 mb-3 rounded-full bg-red-600/10 border border-red-500/30 text-red-500 text-xs font-bold tracking-wider uppercase">
            MEN | WOMEN | POWER LOGISTICS
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            High-potency clinical nutrition requires precision storage and express dispatch. Here is how we get MWP products safely to your doorstep.
          </p>
        </div>
      </section>

      {/* ── Policy Body Content ── */}
      <section className="py-12 md:py-16 px-6 font-sans">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 md:p-14 shadow-2xl space-y-8 text-neutral-300">

            <div className="border-b border-white/10 pb-6">
              <p className="text-sm md:text-base leading-relaxed text-neutral-200">
                At <strong className="text-white font-bold">MWP SUPPLEMENTS</strong>, every batch is precision formulated in GMP-certified, FSSAI-registered facilities and sealed in tamper-evident containers to ensure maximum potency and bio-availability. We dispatch orders rapidly via verified express logistics partners.
              </p>
            </div>

            {/* Order Processing */}
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                Order Processing &amp; Verification
              </h2>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc pl-5 leading-relaxed">
                <li>Orders are verified and sent to fulfillment within <strong>24–48 hours</strong> (excluding Sundays and national holidays).</li>
                <li>Each container undergoes automated weight and seal integrity inspection prior to boxing.</li>
                <li>During high-demand launches or promotional peak periods, dispatch may take up to 72 hours.</li>
                <li>Prepaid orders receive priority queue dispatch.</li>
              </ul>
            </div>

            {/* Standard Delivery Timelines */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-red-500" />
                Delivery Timelines
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Estimated express transit times from dispatch:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <div className="text-xs uppercase tracking-wider text-neutral-400">Metro Cities</div>
                  <div className="text-lg font-bold text-white mt-1">2–4 Business Days</div>
                  <div className="text-xs text-neutral-400 mt-1">Air express priority shipping</div>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <div className="text-xs uppercase tracking-wider text-neutral-400">Rest of India</div>
                  <div className="text-lg font-bold text-white mt-1">4–7 Business Days</div>
                  <div className="text-xs text-neutral-400 mt-1">Tier 2, 3 &amp; regional pin codes</div>
                </div>
              </div>
            </div>

            {/* Shipping Coverage */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Pan-India Coverage
              </h2>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc pl-5 leading-relaxed">
                <li>MWP delivers to over 19,000+ PIN codes across India in partnership with Delhivery, BlueDart, Bluedart Apex, and Shiprocket.</li>
                <li>In rare remote locations where courier service is restricted, our support team will reach out with alternative logistics or issue an immediate full refund.</li>
              </ul>
            </div>

            {/* Shipping Charges */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white">
                Shipping Charges
              </h2>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc pl-5 leading-relaxed">
                <li><strong>FREE Shipping</strong> is provided on all prepaid orders above ₹999 across India.</li>
                <li>Orders below ₹999 or Cash on Delivery (COD) orders may incur a nominal shipping &amp; handling fee shown during checkout.</li>
              </ul>
            </div>

            {/* Order Tracking */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white">
                Live Order Tracking
              </h2>
              <p className="text-sm text-neutral-400">
                Immediately upon dispatch, you will receive an SMS and email containing:
              </p>
              <ul className="space-y-1 text-sm text-neutral-400 list-disc pl-5">
                <li>Courier partner name (BlueDart, Delhivery, etc.)</li>
                <li>Air Waybill (AWB) / Tracking Number</li>
                <li>Direct one-click tracking URL</li>
              </ul>
            </div>

            {/* Tamper-Evident Delivery & Damage Protocol */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                Tamper-Evident Seal Verification
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                All MWP supplement bottles feature our signature tamper-evident shrink sleeve or foil inner seal. Do not accept packages that appear punctured, torn, or re-taped. If you observe packaging damage, record an unboxing video upon receipt and email us within 48 hours for immediate replacement.
              </p>
            </div>

            {/* Delivery Delays */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Unforeseen Delays
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Courier transit times may experience minor delays due to adverse weather, natural disasters, national strikes, or regional courier hub congestions. Our logistics team actively tracks all in-transit parcels to resolve bottlenecks.
              </p>
            </div>

            {/* Support CTA */}
            <div className="pt-6 border-t border-white/10 bg-white/[0.02] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  Need Help With Your Shipment?
                </h3>
                <p className="text-xs text-neutral-400">
                  Our supplement concierge team is on standby to assist with tracking and logistics queries.
                </p>
                <p className="text-xs font-medium text-neutral-200 mt-1">
                  Email: <a href="mailto:support@mwpsupplements.com" className="text-red-400 underline">support@mwpsupplements.com</a>
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Hours: Mon – Sat, 10:00 AM – 7:00 PM IST
                </p>
              </div>
              <a
                href="mailto:support@mwpsupplements.com"
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs uppercase tracking-widest font-bold rounded-xl transition-all text-center shrink-0 shadow-lg shadow-red-900/30"
              >
                Contact Support
              </a>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
