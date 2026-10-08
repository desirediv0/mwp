import Link from "next/link";
import { IconArrowRight, IconHeartHandshake, IconQuote, IconLeaf } from "@tabler/icons-react";
import { PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";
import { EditorialCanvas } from "@/components/layout/EditorialCanvas";

export const metadata = { title: "A letter from our founder" };

export default function FounderPage() {
  return (
    <EditorialCanvas className="mwp-founder">
      <section className="mwp-letter-hero">
        <div className="mwp-container">
          <PageBreadcrumb current="Our founder" />
          <div className="mwp-letter-header">
            <div data-editorial-reveal><p className="mwp-editorial-kicker"><IconHeartHandshake size={17} stroke={1.4} /> A LETTER FROM OUR FOUNDER</p><h1 className="mwp-title">A purpose.<br /><span>Before a product.</span></h1><p className="mwp-lead">Good wellness starts with honest choices. A note on the idea behind MWP, the people we build for and the details that matter.</p><a className="mwp-button mt-7" href="#letter">Read the letter <IconArrowRight size={17} /></a></div>
            <aside className="mwp-founder-art" data-editorial-reveal><span>THE IDEA BEHIND MWP</span><h2>Men.<br />Women.<br />Power.</h2><p>Different everyday needs.<br />One considered collection.</p><span className="mwp-founder-seal"><IconLeaf size={32} stroke={1.1} /></span></aside>
          </div>
        </div>
      </section>
      <section id="letter" className="mwp-section mwp-container mwp-letter" style={{ scrollMarginTop: 132 }}>
        <aside className="mwp-letter-aside"><IconQuote size={28} stroke={1.1} /><p className="text-neutral-800">A note from our founder</p><p className="mt-3">For everyone building a daily routine that feels right for them.</p><Link href="/products" className="mwp-text-link mt-6 inline-block">Meet the collection</Link></aside>
        <article className="mwp-letter-body" data-editorial-reveal>
          <p className="mwp-letter-opening">When we named this brand Men, Women, Power, we wanted those words to mean something.</p>
          <p>Choosing a supplement should be a considered decision. You should be able to understand the formula, read its label, and ask questions before you make it part of your routine.</p>
          <p>That is the idea behind MWP Supplements. We set out to build a collection for different people and different everyday needs: men&apos;s performance, women&apos;s wellness, energy, and daily vitality. Every formula begins with a purpose.</p>
          <p>We believe the details matter. Ingredient choices, serving directions, and clear information deserve as much attention as the bottle itself. Our University and ingredient library are places to explore those details at your own pace.</p>
          <p>Transparency is an ongoing commitment. Our Certificate Wall brings published quality documents together in one place, so you can read the information we share. When you need more, our team is here to help.</p>
          <p>Thank you for taking the time to get to know MWP. We hope our collection earns a place in your routine through considered choices and a standard of care you can see.</p>
          <div className="mwp-letter-signature"><p>With respect,<br /><span>Founder, MWP Supplements</span></p><p className="!mt-3 text-sm text-neutral-500">Men. Women. Power.</p></div>
        </article>
      </section>
      <section className="mwp-section bg-white"><div className="mwp-container"><p className="mwp-editorial-kicker">WHAT GUIDES US</p><h2 className="mwp-heading">The things we come back to.</h2><div className="mwp-values" data-editorial-reveal><div><span>01 / PURPOSE</span><h3>Purpose in every formula</h3><p>A collection designed around distinct needs, with a clear place in an everyday routine.</p></div><div><span>02 / CLARITY</span><h3>Information you can read</h3><p>Product details, ingredient information, and published documents that help you make your own choice.</p></div><div><span>03 / CARE</span><h3>A team you can reach</h3><p>Real support for your questions about products, your order, and what comes next.</p></div></div></div></section>
      <PageNextSteps title="Get to know what goes into MWP." text="Explore the ingredient library and our published quality documents." primary="/certificates" primaryLabel="View certificates" />
    </EditorialCanvas>
  );
}
