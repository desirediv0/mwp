import "./trust-strip.css";

// Compact trust strip: AI-generated line icons in /public/trust, one colour, short titles. The FDA line keeps its small
// "registration is not approval" note because that wording must stay with it.
const BADGES = [
  { icon: "fda", title: "FDA-Registered Facility" },
  { icon: "cgmp", title: "cGMP-Compliant Facility" },
  { icon: "lab", title: "Third-Party Lab Tested" },
  { icon: "nongmo", title: "Non-GMO Ingredients" },
  { icon: "vegan", title: "100% Vegan" },
  { icon: "usa", title: "Made in the USA" },
  { icon: "permit", title: "California Seller's Permit" },
  { icon: "license", title: "Licensed US Business" },
];

function Items({ hidden }) {
  return BADGES.map((b) => (
    <div className="tr-item" key={`${hidden ? "b" : "a"}-${b.icon}`} aria-hidden={hidden || undefined}>
      <span className="tr-icon" aria-hidden="true">
        <i style={{ "--ic": `url(/trust/${b.icon}.svg)` }} />
      </span>
      <div className="tr-txt">
        <b>{b.title}</b>
        {b.note && <small>{b.note}</small>}
      </div>
    </div>
  ));
}

export default function TrustStrip() {
  return (
    <section id="mwp-trust" aria-label="Our quality standards">
      <div className="tr-mask">
        <div className="tr-track">
          <Items />
          <Items hidden />
        </div>
      </div>
    </section>
  );
}
