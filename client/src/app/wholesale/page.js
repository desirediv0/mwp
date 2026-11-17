import Link from "next/link";
import ApplyForm from "./ApplyForm";
import "./wholesale.css";

export const metadata = {
  title: { absolute: "Wholesale | MWP Supplements" },
  description: "Stock MWP Supplements in your store. Order bottle boxes and blister boxes at wholesale prices.",
  alternates: { canonical: "/wholesale" },
};

const STEPS = [
  ["Apply", "Send your business details and resale certificate with the form below."],
  ["Get approved", "We review your application and email you a private wholesale access code."],
  ["Order by the box", "Sign in, see your wholesale prices and order bottle boxes or blister boxes in one go."],
  ["We ship to you", "Your order ships to your business address. Your tracking number is emailed to you."],
];

const FAQ = [
  ["Is there a minimum order?", "Yes. The minimum is 4 boxes per order, in any mix of formulas and pack types."],
  ["Can I mix bottles and blister packs?", "Yes. Order any mix of bottle boxes and blister boxes across all formulas."],
  ["How do I pay?", "After you place an order we email an invoice with the total, shipping included. Payment details come with the invoice."],
  ["When do I get a tracking number?", "As soon as your order ships, we email the tracking number to the address on your account."],
  ["Why do you need a resale certificate?", "It confirms you are buying to resell, so wholesale orders can be handled without sales tax where your state allows."],
];

export default function WholesalePage() {
  return (
    <div className="ws-page">
      <section className="ws-soft">
        <div className="ws-wrap ws-hero">
          <div className="ws-heroText">
            <span className="ws-eyebrow">Wholesale partners</span>
            <h1>Stock MWP in <span className="ws-grey">your store.</span> <span className="ws-gold">Grow with us.</span></h1>
            <p className="ws-lead">Order MWP daily formulas by the box at wholesale prices. Made in the USA in a cGMP-compliant facility and shipped to your door with tracking.</p>
            <div className="ws-btns">
              <a href="#apply" className="ws-btn ws-btnPrimary">Apply for wholesale</a>
              <Link href="/wholesale/order" className="ws-btn ws-btnGhost">Already approved? Order now</Link>
            </div>
          </div>
          <div className="ws-heroCards">
            <div className="ws-card"><span className="ws-big">6</span><b>Bottles per bottle box</b><span className="ws-small">One formula per box</span></div>
            <div className="ws-card"><span className="ws-big">10–24</span><b>Packs per blister box</b><span className="ws-small">Counter-ready boxes</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="ws-wrap">
          <div className="ws-center"><span className="ws-eyebrow">How it works</span><h2>From application to delivery</h2></div>
          <div className="ws-grid4">
            {STEPS.map(([t, d], i) => (
              <div className="ws-card" key={t}><span className="ws-step">{i + 1}</span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="ws-soft">
        <div className="ws-wrap">
          <div className="ws-center"><span className="ws-eyebrow">Wholesale packs</span><h2>Two ways to stock every formula</h2></div>
          <div className="ws-grid2">
            <div className="ws-card ws-pad"><h3>Bottle Box</h3><p><b>1 box = 6 bottles</b> of one formula.</p><p>For shelf displays and customers who buy a full month at a time.</p></div>
            <div className="ws-card ws-pad"><h3>Blister Box</h3><p><b>Single-day blisters</b> or <b>15-day packs</b>, depending on the formula.</p><p>Ideal for the counter and impulse buys.</p></div>
          </div>
        </div>
      </section>

      <section id="apply" className="ws-dark">
        <div className="ws-wrap ws-applyRow">
          <div className="ws-applyIntro">
            <span className="ws-eyebrow">Wholesale application</span>
            <h2>Become an MWP partner</h2>
            <p>Wholesale prices are only for approved businesses. Once approved you get a private access code to see your prices and place orders.</p>
            <ul><li>A valid business with a US shipping address</li><li>EIN / Tax ID</li><li>State resale certificate</li></ul>
          </div>
          <div className="ws-formBox"><ApplyForm /></div>
        </div>
      </section>

      <section>
        <div className="ws-wrap">
          <div className="ws-center"><h2>Wholesale FAQs</h2></div>
          <div className="ws-faq">
            {FAQ.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
          </div>
        </div>
      </section>
    </div>
  );
}
