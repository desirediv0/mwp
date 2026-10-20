import Link from "next/link";
import { SITE_CONTACT } from "@/lib/siteContact";

// Formulas whose final copy is still being written. They get clear placeholder sections for now.
const COMING_SOON = {
  "alpha-prime": "Alpha Prime",
  "titan-force": "Titan Force",
};

export const FDA_DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

export default function ProductExtras({ product }) {
  const placeholderName = COMING_SOON[product?.slug];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-label="Product information">
      {placeholderName && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {[
            ["Overview", `A full overview of ${placeholderName} is being finalized and will be published here soon.`],
            ["Key ingredients", "The complete ingredient list with amounts will appear here once finalized."],
            ["Suggested use", "Serving size and directions will be added here with the final label."],
            ["Supplement facts", "The full Supplement Facts panel will be added here."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5">
              <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600">{text}</p>
              <span className="mt-3 inline-block rounded-full bg-neutral-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Coming soon</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Shipping within the USA</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-neutral-600">
            <li>We ship to all 50 states and U.S. territories served by USPS, UPS and FedEx.</li>
            <li>Orders are packed within 1-2 business days. You see live carrier rates and delivery estimates at checkout.</li>
            <li>A tracking link is emailed as soon as your package is scanned by the carrier.</li>
          </ul>
          <Link href="/shipping-policy" className="mt-3 inline-block text-[13px] font-medium text-neutral-900 underline underline-offset-4">Read the shipping policy</Link>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Returns and support</h3>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-neutral-600">
            <li>Damaged or wrong item? Contact us within 7 days of delivery and we will make it right.</li>
            <li>Questions about an order: {SITE_CONTACT.email}</li>
          </ul>
          <Link href="/return-policy" className="mt-3 inline-block text-[13px] font-medium text-neutral-900 underline underline-offset-4">Read the returns policy</Link>
        </div>
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-neutral-500" data-fda-disclaimer>
        * {FDA_DISCLAIMER}
      </p>
    </section>
  );
}
