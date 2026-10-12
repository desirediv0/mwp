import Link from "next/link";
import PolicyLayout, { P, UL, Note } from "@/components/layout/PolicyLayout";
import { SITE_CONTACT } from "@/lib/siteContact";

export const metadata = {
  title: "Shipping & Delivery Policy | MWP SUPPLEMENTS",
  description:
    "MWP Supplements order processing times, shipping charges at checkout, tracking, tamper-evident packaging and what to do if your parcel arrives damaged.",
};

const link = "font-semibold text-[#8f6f3a] underline underline-offset-4";

const sections = [
  {
    id: "processing",
    title: "Order processing",
    body: (
      <>
        <UL
          items={[
            <>Orders are checked and sent to fulfillment within <strong className="text-neutral-900">24–48 hours</strong>, excluding weekends and holidays.</>,
            "Each container is inspected for seal integrity before it is packed.",
            "During busy launches or promotions, dispatch can take up to 72 hours.",
          ]}
        />
      </>
    ),
  },
  {
    id: "rates-delivery",
    title: "Shipping charges and delivery times",
    body: (
      <>
        <P>
          Available shipping options, delivery estimates and any shipping charges are calculated for your address and
          shown in US dollars at checkout, before you pay. Please review the final total before you place your order.
        </P>
        <P>
          If we cannot deliver to your location, we will contact you with options or give you a full refund.
        </P>
      </>
    ),
  },
  {
    id: "tracking",
    title: "Tracking your order",
    body: (
      <>
        <P>When your order ships, we email you:</P>
        <UL
          items={[
            "The carrier delivering your parcel.",
            "Your tracking number.",
            "A direct link to track it.",
          ]}
        />
        <P className="mt-4">
          You can also check your order status any time from <Link className={link} href="/account/orders">your account</Link>.
        </P>
      </>
    ),
  },
  {
    id: "packaging",
    title: "Tamper-evident packaging",
    body: (
      <>
        <P>
          Every MWP bottle has a tamper-evident seal. Please do not accept a parcel that looks punctured, torn or
          re-taped. If you see packaging damage, record an unboxing video when you receive it and email us within 48
          hours so we can send a replacement.
        </P>
        <Note>
          Full steps are in our <Link className={link} href="/return-policy">Returns &amp; Replacement Policy</Link>.
        </Note>
      </>
    ),
  },
  {
    id: "delays",
    title: "Delays",
    body: (
      <P>
        Carrier transit times can be affected by weather, natural events, strikes or heavy volume, which are outside
        our control. We watch in-transit parcels and will help you if one is delayed.
      </P>
    ),
  },
  {
    id: "address",
    title: "Address accuracy",
    body: (
      <P>
        Please double-check your shipping address at checkout. If you spot a mistake after ordering, email{" "}
        <a className={link} href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a> straight away. We can only
        change it before your order ships.
      </P>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout
      kicker="Men · Women · Power logistics"
      title="Shipping &"
      accent="Delivery"
      intro="How we pack, send and track your MWP order, so it reaches you sealed, safe and on time."
      updated="October 2026"
      highlights={[
        { title: "Ships in 24–48 hours", text: "Orders are processed within 1–2 business days, excluding weekends and holidays." },
        { title: "Rates shown at checkout", text: "Your delivery estimate and shipping total are shown in USD before you pay." },
        { title: "Sealed and trackable", text: "Tamper-evident seals, plus an email with your tracking link when it ships." },
      ]}
      sections={sections}
      contactTitle="Need help with a shipment?"
    />
  );
}
