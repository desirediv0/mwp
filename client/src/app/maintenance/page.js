import { IconClock } from "@tabler/icons-react";

export const metadata = {
  title: "Coming Soon | MWP Supplements",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex items-center justify-center px-5 py-16 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-white/[0.04] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-white/[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-white/[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-auto text-center flex flex-col items-center">
        {/* Wordmark */}
        <p className="font-extrabold tracking-[0.5em] text-2xl sm:text-3xl bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          MWP
        </p>
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 mt-2">
          Men &bull; Women &bull; Power
        </p>

        {/* Divider */}
        <div className="w-10 h-px bg-white/15 my-8" />

        {/* Status pill */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 text-white/80 text-[10px] font-bold uppercase tracking-[0.18em]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
          </span>
          <IconClock className="h-3.5 w-3.5" /> Under Maintenance
        </div>

        {/* Headline */}
        <h1 className="mt-6 text-[2.6rem] sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
          We&apos;ll Be Back
          <br />
          <span className="bg-gradient-to-r from-white via-white/70 to-white/40 bg-clip-text text-transparent">
            Soon
          </span>
        </h1>

        <p className="mt-5 text-white/45 text-[14px] sm:text-[15px] leading-relaxed max-w-sm">
          We&apos;re making some improvements behind the scenes to serve you better.
          <br className="hidden sm:block" /> Please check back shortly.
        </p>

        {/* Progress shimmer bar */}
        <div className="mt-10 w-52 h-[2px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_2.2s_ease-in-out_infinite]" />
        </div>

        {/* Footer note */}
        <p className="mt-10 text-[10px] uppercase tracking-[0.25em] text-white/25">
          &copy; {new Date().getFullYear()} MWP Supplements &bull; All Rights Reserved
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  );
}
