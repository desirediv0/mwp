import PolicyLayout, { P, UL, Note, Steps } from "@/components/layout/PolicyLayout";
import { SITE_CONTACT } from "@/lib/siteContact";

export const metadata = {
  title: "Returns & Replacement Policy | MWP SUPPLEMENTS",
  description:
    "How MWP Supplements handles damaged or incorrect orders, replacements, refunds and cancellations, and why opened supplement containers cannot be returned.",
};

const link = "font-semibold text-[#8f6f3a] underline underline-offset-4";

const sections = [
  {
    id: "how-it-works",
    title: "Replacement and claim process",
    body: (
      <>
        <P>If something is wrong with your order, here is exactly what to do:</P>
        <Steps
          steps={[
            { title: "Record an unboxing video", text: "Film the parcel and the unopened product in one continuous video, starting before you open the box." },
            { title: "Report within 48 hours", text: `Email the video and your order number to ${SITE_CONTACT.email} within 48 hours of delivery.` },
            { title: "Quality review", text: "Our team checks for transit damage, a broken seal or a fulfillment mistake." },
            { title: "Priority replacement", text: "Approved replacements are shipped as a priority." },
          ]}
        />
      </>
    ),
  },
  {
    id: "free-replacement",
    title: "When we replace your order free of charge",
    body: (
      <>
        <P>We send a fresh replacement at no cost if:</P>
        <UL
          items={[
            "Your shipment arrived damaged, crushed or leaking.",
            "The tamper-evident safety seal was broken when it arrived.",
            "We sent the wrong product or formula.",
          ]}
        />
        <Note>All damage or wrong-item requests must be reported within 48 hours of delivery, with unboxing video proof.</Note>
      </>
    ),
  },
  {
    id: "unboxing-video",
    title: "What the unboxing video must show",
    body: (
      <>
        <P>
          To protect against tampering in transit and to verify product integrity, we need one continuous, uncut video that shows:
        </P>
        <UL
          items={[
            "The shipping label, with your name, address and tracking number, before the box is opened.",
            "The outside of the parcel from all sides before any tape is cut.",
            "Unbroken recording until the bottle and its safety seal are clearly visible.",
          ]}
        />
      </>
    ),
  },
  {
    id: "hygiene",
    title: "Hygiene and safety: opened products",
    body: (
      <>
        <P>
          MWP formulas are ingestible products packed under cGMP-compliant standards. For health and safety reasons,{" "}
          <strong className="text-neutral-900">opened, unsealed or partially used containers cannot be returned.</strong>
        </P>
        <P>We cannot accept returns for:</P>
        <UL
          items={[
            "Change of mind, or taste and flavor preference.",
            "Choosing the wrong product or pack size.",
            "Opened, unsealed or partially used containers.",
            "Items bought in a final-sale or clearance promotion.",
            "Products not stored in a cool, dry place as directed.",
          ]}
        />
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <P>
        If an approved replacement is out of stock or cannot be delivered, we refund 100% of the item to your original
        payment method, normally within 5–7 business days of approval. Your bank may take extra time to show it.
      </P>
    ),
  },
  {
    id: "cancellations",
    title: "Cancelling an order",
    body: (
      <P>
        You can cancel for free before your order has been packed and shipped. Email{" "}
        <a className={link} href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a> with your order number as
        soon as possible. Once it has shipped, it can no longer be cancelled.
      </P>
    ),
  },
  {
    id: "fraud",
    title: "Protecting every customer",
    body: (
      <P>
        We may decline a replacement request that has no valid video verification or that shows signs of deliberate
        tampering, and we review unusual claim patterns. This keeps the process fair and fast for everyone else.
      </P>
    ),
  },
];

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout
      kicker="Integrity & hygiene standards"
      title="Returns &"
      accent="Replacements"
      intro="Supplements are consumables, so we protect every customer with clear safety rules. If something arrives wrong, we make it right."
      updated="October 2026"
      highlights={[
        { title: "Report in 48 hours", text: "Damaged or wrong item? Send us your order number and an unboxing video within 48 hours." },
        { title: "Free replacements", text: "Approved damage or fulfillment mistakes are replaced at no cost, as a priority." },
        { title: "Sealed for your safety", text: "Opened or unsealed containers cannot be returned, for health and safety." },
      ]}
      sections={sections}
      contactTitle="Need to file a claim or ask about one?"
    />
  );
}
