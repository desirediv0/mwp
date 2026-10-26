import Link from "next/link";
import Image from "next/image";
import { IconArrowRight, IconQuote, IconShieldCheck, IconFlask2, IconBolt } from "@tabler/icons-react";

export const metadata = {
  title: "A Letter From Our Founder",
  description:
    "Why MWP Supplements was created: honest formulas, clear ingredients and trust before hype. A personal letter from our founder.",
  alternates: { canonical: "/founder" },
  openGraph: {
    title: "A Letter From Our Founder | MWP SUPPLEMENTS",
    description: "Why MWP Supplements was created: honest formulas, clear ingredients and trust before hype.",
    url: "/founder",
    type: "website",
  },
};

// Founder photo: put the picture in /public (for example /public/founder.jpg) and set the path here.
// Until then a clean monogram card is shown in its place. Best size: portrait, about 800 x 1000 px.
const FOUNDER_PHOTO = null; // e.g. "/founder.jpg"

const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

const LETTER = [
  "I created MWP because the supplement industry should feel more honest, more thoughtful, and more human. Choosing a wellness product should not mean guessing what is inside, searching for answers, or settling for promises that do not feel real.",
  "From the beginning, my vision has been to build a brand that respects both performance and transparency. Every formula should have a purpose. Every ingredient should have a reason. Every product should be made with care, responsibility, and the kind of attention to detail that people can feel.",
  "MWP stands for Men, Women, and Power—but power means something different to everyone. It can mean showing up for your family, taking care of your health, training harder, rebuilding your confidence, or simply choosing yourself again. Our goal is to support that journey with products you can trust.",
  "We are still growing, learning, and building this brand one careful decision at a time. What will never change is our commitment to quality, honest communication, and putting people before hype.",
  "Thank you for being part of the beginning. Your trust is not something we take lightly, and it is the reason MWP exists.",
];

const VALUES = [
  [IconFlask2, "01", "Purposeful formulas", "Each formula begins with a clear purpose and is developed around thoughtful ingredient choices—not unnecessary hype."],
  [IconShieldCheck, "02", "Radical transparency", "We believe customers should be able to understand what they buy, why it is there, and how it fits into their routine."],
  [IconBolt, "03", "Everyday power", "MWP is made for real life—the small, consistent choices that help you show up as your strongest self."],
];

const FACTS = [
  ["MWP", "Men · Women · Power"],
  ["Made in the USA", "FDA-registered, cGMP facility"],
  ["Tested", "Third-party lab tested"],
];

export default function FounderPage() {
  return (
    <main className="bg-white text-[#12213F]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1530] via-[#12213F] to-[#1B2D52] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#D4A437]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[#B3001B]/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E6C26A]">The story behind MWP</p>
            <h1 className="mt-5 text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              A letter from
              <br />
              <span className="font-normal italic text-[#E6C26A]" style={SERIF}>our founder.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#CDD4E6] sm:text-lg">
              MWP was created with one simple belief: people deserve to know what they are putting into their bodies&mdash;and feel proud of the products they choose.
            </p>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm">
              <Image src="/mwp-logo-3.png" alt="MWP Supplements" width={320} height={113} className="mx-auto h-auto w-56" priority />
              <dl className="mt-6 divide-y divide-white/10 text-left">
                {FACTS.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E6C26A]">{k}</dt>
                    <dd className="text-right text-[13px] text-[#E3E7F2]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Letter */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <figure className="relative mx-auto w-full max-w-[320px] lg:max-w-none">
              <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-[#E6C26A] via-[#D4A437] to-[#A8741F] opacity-90" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#12213F] via-[#1B2D52] to-[#0B1530]">
                {FOUNDER_PHOTO ? (
                  <Image src={FOUNDER_PHOTO} alt="Reh Singh, founder of MWP Supplements" fill sizes="(min-width: 1024px) 280px, 320px" className="object-cover" priority />
                ) : (
                  <div role="img" aria-label="Reh Singh, founder of MWP Supplements" className="flex h-full flex-col items-center justify-center text-center">
                    <span className="grid h-24 w-24 place-items-center rounded-full border border-[#E6C26A]/60 text-4xl text-[#E6C26A]" style={SERIF}>RS</span>
                    <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E6C26A]">Reh Singh</span>
                    <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#CDD4E6]">Founder</span>
                  </div>
                )}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0B1530]/70 to-transparent" />
              </div>
              <figcaption className="sr-only">Reh Singh, Founder, MWP Supplements</figcaption>
            </figure>
            <div className="rounded-3xl border border-[#EADFC4] bg-[#FBF5E6] p-6">
              <IconQuote size={28} stroke={1.4} className="text-[#A8741F]" />
              <p className="mt-4 text-[22px] leading-snug text-[#12213F]" style={SERIF}>
                A personal note from the person behind MWP.
              </p>
              <div className="mt-6 border-t border-[#EADFC4] pt-4">
                <p className="text-sm font-semibold">Reh Singh</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-[#5A6275]">Founder, MWP Supplements</p>
              </div>
            </div>
          </aside>

          <article className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Power should come with trust.</h2>
            <div className="mt-8 space-y-6 text-[17px] leading-[1.85] text-[#26314D] sm:text-[18px]" style={SERIF}>
              <p>
                <span className="float-left mr-3 mt-1 text-7xl leading-[0.78] text-[#A8741F]">D</span>
                ear MWP community,
              </p>
              <div className="clear-both" />
              {LETTER.map((p, i) => (
                <p
                  key={p}
                  className={i === 2 ? "rounded-2xl border-l-4 border-[#D4A437] bg-[#FBF5E6] px-5 py-4 text-[#12213F]" : undefined}
                >
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-10 border-t border-[#E9E4D6] pt-6">
              <p className="text-3xl italic text-[#A8741F]" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                With strength,
              </p>
              <p className="mt-2 text-sm font-semibold">Reh Singh</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#5A6275]">Founder, MWP Supplements</p>
            </div>
          </article>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-[#EEE9DA] bg-[#FAF8F2]">
        <div className="mx-auto max-w-6xl px-5 py-14 text-center sm:px-8 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8741F]">What guides us</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Built with intention.</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#5A6275]">
            Our promise is simple: make products we can stand behind and give customers the clarity they deserve.
          </p>
          <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
            {VALUES.map(([Icon, n, title, text]) => (
              <div key={n} className="group rounded-3xl border border-[#E6DFC9] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#D4A437] hover:shadow-[0_24px_40px_-30px_#12213F66]">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#12213F] text-[#E6C26A]">
                    <Icon size={22} stroke={1.5} />
                  </span>
                  <span className="text-sm font-semibold tracking-[0.25em] text-[#D4A437]">{n}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#5A6275]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#12213F] to-[#0B1530] p-8 text-white sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D4A437]/25 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E6C26A]">Our founder&apos;s promise</p>
              <p className="mt-4 text-3xl leading-tight sm:text-4xl" style={SERIF}>
                &ldquo;We will always choose trust over shortcuts.&rdquo;
              </p>
            </div>
            <p className="text-[15px] leading-relaxed text-[#CDD4E6]">
              Premium performance. Transparent formula. Independently tested. That is the standard we are building MWP around.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#12213F] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#B3001B]">
            Explore the formulas <IconArrowRight size={16} />
          </Link>
          <Link href="/ingredients" className="inline-flex items-center gap-2 rounded-full border border-[#12213F]/25 px-7 py-3.5 text-sm font-medium text-[#12213F] transition-colors hover:border-[#A8741F] hover:text-[#A8741F]">
            Meet the ingredients <IconArrowRight size={16} />
          </Link>
        </div>

        <p className="mt-10 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#6B7388]">
          MWP Supplements LLC &middot; Men &middot; Women &middot; Power
        </p>
      </section>
    </main>
  );
}
