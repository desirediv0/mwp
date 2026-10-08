import { IconClock } from "@tabler/icons-react";

export const metadata = {
  title: "Coming Soon | MWP Supplements",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="relative min-h-screen bg-white text-neutral-900 flex items-center justify-center px-5 py-16 overflow-hidden">
      {/* Ambient glows */}

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

      <div className="relative z-10 w-full max-w-lg mx-auto text-center flex flex-col items-center">
        {/* Wordmark */}
        <p className="font-extrabold tracking-[0.5em] text-2xl sm:text-3xl bg-gradient-to-b from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
          MWP
        </p>
        <p className="text-[10px] uppercase tracking-[0.5em] text-neutral-900 mt-2">
          Men &bull; Women &bull; Power
        </p>

        {/* Divider */}
        <div className="w-10 h-px bg-white/15 my-8" />

        {/* Status pill */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-neutral-200 text-neutral-900 text-[10px] font-bold uppercase tracking-[0.18em]">
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
          <span className="bg-gradient-to-r from-neutral-900 via-white/70 to-neutral-600 bg-clip-text text-transparent">
            Soon
          </span>
        </h1>

        <p className="mt-5 text-neutral-900 text-[14px] sm:text-[15px] leading-relaxed max-w-sm">
          We&apos;re making some improvements behind the scenes to serve you better.
          <br className="hidden sm:block" /> Please check back shortly.
        </p>

        {/* Progress shimmer bar */}
        <div className="mt-10 w-52 h-[2px] rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_2.2s_ease-in-out_infinite]" />
        </div>

        {/* Footer note */}
        <p className="mt-10 text-[10px] uppercase tracking-[0.25em] text-neutral-900">
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
