export const metadata = { title: "A letter from our founder" };

const SERIF = { fontFamily: "Georgia, 'Times New Roman', serif" };

const LETTER = [
  "I created MWP because the supplement industry should feel more honest, more thoughtful, and more human. Choosing a wellness product should not mean guessing what is inside, searching for answers, or settling for promises that do not feel real.",
  "From the beginning, my vision has been to build a brand that respects both performance and transparency. Every formula should have a purpose. Every ingredient should have a reason. Every product should be made with care, responsibility, and the kind of attention I would expect for the people I love.",
  "MWP stands for Men, Women, and Power—but power means something different to everyone. It can mean showing up for your family, taking care of your health, training harder, rebuilding your confidence, or simply choosing yourself again. Our goal is to support that everyday strength with premium formulas and clear information you can trust.",
  "We are still growing, learning, and building this brand one careful decision at a time. What will never change is our commitment to quality, honest communication, and putting people before hype.",
  "Thank you for being part of the beginning. Your trust is not something we take lightly, and it is the reason MWP exists.",
];

const VALUES = [
  ["01", "Purposeful formulas", "Each formula begins with a clear purpose and is developed around thoughtful ingredient choices—not unnecessary hype."],
  ["02", "Radical transparency", "We believe customers should be able to understand what they buy, why it is there, and how it fits into their routine."],
  ["03", "Everyday power", "MWP is made for real life—the small, consistent choices that help you show up as your strongest self."],
];

export default function FounderPage() {
  return (
    <main className="bg-[#f6f2ea] text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#8f6f3a] sm:text-xs">The story behind MWP</p>
          <h1 className="mt-5 text-5xl font-bold leading-[1] tracking-tight sm:text-7xl lg:text-8xl">
            A letter from
            <br />
            <span className="font-normal italic text-[#8f6f3a]" style={SERIF}>our founder.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            MWP was created with one simple belief: people deserve to know what they are putting into their bodies—and feel proud of the products they choose.
          </p>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div
              role="img"
              aria-label="Founder portrait, image coming soon"
              className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#d9c6b3] via-[#efe4d8] to-[#b99e84]"
            >
              <span className="border border-white/70 px-6 py-5 text-center text-[10px] font-semibold uppercase leading-loose tracking-[0.3em] text-white/80">
                Founder
                <br />
                photo
              </span>
              <span className="absolute bottom-5 left-6 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/80">
                Founder portrait · image coming soon
              </span>
            </div>
          </div>

          <article>
            <span aria-hidden="true" className="block text-5xl leading-none text-[#c9a15a]" style={SERIF}>“</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Power should come with trust.</h2>

            <div className="mt-8 space-y-5 text-[17px] leading-[1.8] text-neutral-700" style={SERIF}>
              <p>
                <span className="float-left mr-3 mt-1 text-7xl leading-[0.8] text-[#8f6f3a]">D</span>
                ear MWP community,
              </p>
              <div className="clear-both" />
              {LETTER.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-3xl italic text-[#7a5a2b]" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                With strength,
              </p>
              <p className="mt-2 text-sm font-bold">Reh Singh</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Founder, MWP Supplements</p>
            </div>
          </article>
        </section>

        <hr className="mt-16 border-neutral-300/70" />

        <section className="mt-14 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8f6f3a]">What guides us</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Built with intention.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-600">
            Our promise is simple: make products we can stand behind and give customers the clarity they deserve.
          </p>
          <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
            {VALUES.map(([n, title, text]) => (
              <div key={n} className="rounded-3xl border border-[#e3d7c5] bg-white p-6">
                <p className="text-[10px] font-bold tracking-[0.3em] text-[#c9a15a]">{n}</p>
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid items-center gap-6 rounded-[2rem] bg-[#111214] p-8 text-white sm:p-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e5c56a]">Our founder&apos;s promise</p>
            <p className="mt-4 text-3xl leading-tight sm:text-4xl" style={SERIF}>
              “We will always choose trust over shortcuts.”
            </p>
          </div>
          <p className="text-sm leading-relaxed text-neutral-300">
            Premium performance. Transparent formula. Independently tested. That is the standard we are building MWP around.
          </p>
        </section>

        <p className="mt-8 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
          MWP Supplements LLC · Men · Women · Power
        </p>
      </div>
    </main>
  );
}
