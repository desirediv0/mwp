import { Instagram, Facebook, ArrowUpRight } from "lucide-react";

const SOCIALS = [
  {
    name: "Instagram",
    handle: "@mwpsupplements",
    url: "https://www.instagram.com/mwpsupplements",
    icon: Instagram,
    accent: "#E1306C",
    accentBg: "rgba(225, 48, 108, 0.08)",
    desc: "Discover the latest in imported premium fashion — clothing, bags, footwear and accessories curated just for you.",
    stats: "62K+ Followers"
  },
  {
    name: "Facebook",
    handle: "mwpsupplements",
    url: "https://www.facebook.com/mwpsupplementsfamily",
    icon: Facebook,
    accent: "#1877F2",
    accentBg: "rgba(24, 119, 242, 0.08)",
    desc: "Join our community for exclusive deals, new arrivals, and behind-the-scenes content from MWP Supplements.",
    stats: "Join Our Family"
  },
];

export const SocialMediaSection = () => {
  return (
    <section className="relative bg-gray-50 py-20 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" style={{ background: "rgba(169,88,164,0.05)" }} />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" style={{ background: "rgba(0,174,239,0.05)" }} />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase tracking-wider mb-5 font-semibold" style={{ background: "#A958A412", color: "#A958A4" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#A958A4" }} />
              Join Our Community
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              We&apos;re active online. <br />
              <span style={{ color: "#A958A4" }}>Connect with us.</span>
            </h2>
          </div>
          <p className="text-gray-500 max-w-xs md:text-right text-base leading-relaxed">
            Follow us for daily style inspiration, new arrivals, and exclusive community offers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {SOCIALS.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white p-8 rounded-[32px] border border-gray-100 transition-all duration-500 hover:border-transparent hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(135deg, ${s.accentBg} 0%, transparent 100%)` }}
              />

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
                  style={{ background: s.accentBg }}
                >
                  <s.icon className="h-7 w-7" style={{ color: s.accent }} />
                </div>
                <div className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-all duration-300">
                  <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{s.name}</h3>
                <p className="text-sm font-semibold mb-4 transition-colors" style={{ color: s.accent }}>
                  {s.handle}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mb-6 group-hover:text-gray-600 transition-colors">
                  {s.desc}
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-[11px] text-gray-400 group-hover:bg-white group-hover:text-gray-500 transition-colors border border-transparent group-hover:border-gray-100">
                  {s.stats}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMediaSection;