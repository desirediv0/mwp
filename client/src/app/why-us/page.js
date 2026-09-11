import {
  Zap,
  ShieldCheck,
  Award,
  Activity,
  CheckCircle2,
  Dna,
  ArrowRight,
  Flame,
  Star
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Why MWP SUPPLEMENTS | Clinical Purity & Performance",
  description: "Discover why competitive athletes and fitness professionals choose MWP SUPPLEMENTS: 100% clinical transparency, zero proprietary blends, third-party lab tested, and maximum bioavailability.",
};

const PILLARS = [
  {
    icon: Dna,
    title: "100% Full Label Transparency",
    description: "No hidden 'proprietary blends' or fairy dusting. Every milligram of active ingredient—from KSM-66 Ashwagandha to L-Citrulline Malate—is explicitly listed on our bottle labels.",
  },
  {
    icon: Zap,
    title: "Clinical Potency Dosages",
    description: "We dose ingredients according to peer-reviewed human clinical trials, not marketing budgets. You get real physiological results, enhanced ATP production, and optimal endurance.",
  },
  {
    icon: ShieldCheck,
    title: "Third-Party Certified & Tested",
    description: "Every production batch undergoes independent HPLC testing for purity, heavy metals, microbial safety, and zero banned substances. Certified GMP and FSSAI approved.",
  },
  {
    icon: Flame,
    title: "Bio-Enhanced Absorption",
    description: "Our formulations integrate standardized absorption boosters like Piperine / BioPerine to ensure maximum nutrient uptake across gut barriers into bloodstream and muscle cells.",
  },
  {
    icon: Activity,
    title: "Engineered for Men & Women",
    description: "Tailored physiological protocols. Ultra Pro and Power Max drive peak male testosterone and explosive gym output; Her Power and Her Energy balance hormonal vitality and clean sustained focus.",
  },
  {
    icon: Award,
    title: "Zero Junk, Banned Substance Free",
    description: "No artificial dyes, no chemical fillers, and zero banned stimulants. Clean energy that delivers rapid athletic output without post-workout jitters or energy crashes.",
  },
];

const COMPARISON = [
  { feature: "Full Label Transparency", mwp: "100% Clinical Doses Disclosed", standard: "Hidden 'Proprietary Blends'" },
  { feature: "Active Ingredient Quality", mwp: "Standardized Extracts (KSM-66, Fulvic 75%)", standard: "Low-grade raw powders" },
  { feature: "Third-Party Lab Testing", mwp: "Every Batch Verified via HPLC", standard: "Occasional or self-tested" },
  { feature: "Artificial Fillers & Dyes", mwp: "Zero Artificial Dyes / No Fillers", standard: "Loaded with maltodextrin & dyes" },
  { feature: "Formulation Focus", mwp: "Men • Women • Power Targeted", standard: "Generic one-size-fits-all" },
];

const REVIEWS = [
  {
    name: "Vikram S.",
    role: "Competitive Powerlifter & Coach",
    text: "Ultra Pro paired with Power Max has transformed my training block. Noticeable jump in recovery rate, explosive strength on heavy compounds, and zero gastrointestinal distress.",
    rating: 5,
  },
  {
    name: "Dr. Ananya P.",
    role: "Sports Nutritionist & Triathlete",
    text: "Her Energy is the cleanest adaptogenic focus formula I have analyzed. Cordyceps and Rhodiola in clinical ratios provide sustained stamina across long runs without any caffeine crash.",
    rating: 5,
  },
  {
    name: "Karan M.",
    role: "CrossFit Athlete & Gym Owner",
    text: "Rapid Boost delivers immediate blood flow and pumps within 20 minutes. My athletes love the clean formula and the fact that MWP provides third-party COAs on demand.",
    rating: 5,
  },
];

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <img
          src="/why-us-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/60 to-black/40" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-[0.28em] uppercase mb-6 backdrop-blur-sm">
            Men • Women • Power
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Engineered For Pure Human{" "}
            <span className="text-red-500">Performance</span>
          </h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            The sports nutrition industry is filled with under-dosed blends and marketing illusions.
            MWP SUPPLEMENTS was founded on one rule: clinical doses of research-backed compounds
            that deliver undeniable physiological power.
          </p>
        </div>
      </section>

      {/* ── 6 Core Pillars ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              The MWP Standard of Excellence
            </h2>
            <p className="text-gray-500 text-sm max-w-lg mx-auto">
              How our rigorous formulation standards separate us from commercial retail brands.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="bg-[#fafafa] rounded-2xl p-7 border border-gray-100 hover:border-red-300 hover:shadow-lg transition-all duration-300 group shadow-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                    <Icon className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-20 bg-[#fafafa] border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              MWP vs Conventional Supplements
            </h2>
            <p className="text-gray-500 text-xs">
              Direct comparison of quality benchmarks
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="p-4">Benchmark</th>
                  <th className="p-4 text-red-500 font-bold">MWP SUPPLEMENTS</th>
                  <th className="p-4 text-gray-500">Industry Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {COMPARISON.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{row.feature}</td>
                    <td className="p-4 text-red-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                      {row.mwp}
                    </td>
                    <td className="p-4 text-gray-500">{row.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Athlete Reviews ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Athlete &amp; Coach Endorsements
            </h2>
            <p className="text-gray-500 text-sm">
              Real feedback from individuals who demand maximum output from their bodies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((review, i) => (
              <div
                key={i}
                className="bg-[#fafafa] rounded-2xl p-7 border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-gray-900/70 text-xs italic leading-relaxed mb-6">
                    &quot;{review.text}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-3 border-t border-gray-100 pt-4 mt-auto">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold bg-red-50 text-red-600 border border-red-100">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{review.name}</h4>
                    <p className="text-[11px] text-gray-500">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium CTA ── */}
      <section className="py-20 bg-gradient-to-t from-[#fafafa] to-white border-t border-gray-100 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Unleash Your Full Performance
          </h2>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Choose your protocol: Men&apos;s Vitality, Gym Output, Blood Flow Circulation, Women&apos;s Hormone Balance, Clean Energy, or 32-in-1 Daily Immunity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 transition-all rounded-xl shadow-lg shadow-red-900/30"
            >
              Shop All 6 MWP Formulas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
