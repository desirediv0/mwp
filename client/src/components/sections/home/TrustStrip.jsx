import { Jost } from "next/font/google";
import "./trust-strip.css";

const jost = Jost({ subsets: ["latin"], weight: ["600", "700", "800", "900"], display: "swap" });

// Eight round metallic badges. The FDA line carries the "registration is not approval" note.
const BADGES = [
  { file: "fda-registered", alt: "FDA-Registered Facility badge", title: ["FDA-Registered", "Facility"], text: "Made in a facility registered with the FDA.", note: "Registration is not FDA approval." },
  { file: "cgmp", alt: "cGMP-Compliant Facility badge", title: ["cGMP-Compliant", "Facility"], text: "Made under strict quality rules, so every bottle is made the same clean, careful way." },
  { file: "third-party-lab", alt: "Third-Party Lab Tested badge", title: ["Third-Party", "Lab Tested"], text: "An outside lab, not us, checks our products, so you can trust the label." },
  { file: "non-gmo", alt: "Non-GMO Ingredients badge", title: ["Non-GMO", "Ingredients"], text: "Made with ingredients that are not genetically modified." },
  { file: "vegan", alt: "100% Vegan badge", title: ["100%", "Vegan"], text: "Plant-based ingredients and veggie capsules. Nothing from animals." },
  { file: "made-in-usa", alt: "Made in the USA badge", title: ["Made in", "the USA"], text: "Made in the United States with ingredients sourced from around the world." },
  { file: "sellers-permit", alt: "California Seller's Permit badge", title: ["California", "Seller's Permit"], text: "Registered with the State of California to sell our products." },
  { file: "business-license", alt: "Licensed US Business badge", title: ["Licensed", "US Business"], text: "A licensed company based in El Segundo, California." },
];

function Items({ hidden }) {
  return BADGES.map((b) => (
    <div className="tr-item" key={`${hidden ? "b" : "a"}-${b.file}`} aria-hidden={hidden || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tr-badge" src={`/badges/${b.file}.webp`} alt={hidden ? "" : b.alt} width="150" height="150" loading="lazy" />
      <div className="tr-txt">
        <b>{b.title[0]}<br />{b.title[1]}</b>
        <p>{b.text}</p>
        {b.note && <small>{b.note}</small>}
      </div>
    </div>
  ));
}

export default function TrustStrip() {
  return (
    <section id="mwp-trust" className={jost.className} aria-label="Our quality standards">
      <div className="tr-mask">
        <div className="tr-track">
          <Items />
          <Items hidden />
        </div>
      </div>
    </section>
  );
}
