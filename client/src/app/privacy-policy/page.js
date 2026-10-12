import Link from "next/link";
import PolicyLayout, { P, UL, Note } from "@/components/layout/PolicyLayout";
import { SITE_CONTACT } from "@/lib/siteContact";

export const metadata = {
  title: "Privacy Policy | MWP SUPPLEMENTS",
  description:
    "How MWP Supplements collects, uses and protects your personal information, including order details, payments and cookies.",
};

const sections = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <P>
          {SITE_CONTACT.company} (“MWP”, “we”, “us” or “our”) operates mwpsupplements.com. This Privacy Policy explains
          what personal information we collect when you browse, create an account, place an order or contact us, how we
          use it, and the choices you have.
        </P>
        <P>
          Our mailing address is {SITE_CONTACT.mailing}.
        </P>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <P>We collect only what we need to run the shop and support you:</P>
        <UL
          items={[
            <><strong className="text-neutral-900">Contact details:</strong> your name, email address and phone number.</>,
            <><strong className="text-neutral-900">Shipping and billing details:</strong> the addresses you enter at checkout.</>,
            <><strong className="text-neutral-900">Order history:</strong> what you bought, when, order status and receipts.</>,
            <><strong className="text-neutral-900">Messages:</strong> anything you send us through the contact form or by email.</>,
            <><strong className="text-neutral-900">Technical data:</strong> IP address, browser and device type, and pages visited, collected through cookies and similar tools.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use your information",
    body: (
      <>
        <UL
          items={[
            "To process, ship and track your orders and send receipts and order updates by email.",
            "To answer your questions and provide customer support.",
            "To keep your account, cart and checkout working.",
            "To detect and prevent fraud, abuse and security problems.",
            "To understand how the site is used so we can improve it.",
            "To meet legal and tax obligations.",
          ]}
        />
      </>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <>
        <P>
          Payments are processed by our payment provider, Stripe. Your card details are entered into Stripe’s secure
          payment form and sent directly to Stripe. MWP does not receive or store your full card number or security code.
          Stripe handles payment information under its own privacy policy.
        </P>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <P>
          <strong className="text-neutral-900">We do not sell your personal information.</strong> We share it only with
          the service providers that help us operate the shop, and only as needed to do their job:
        </P>
        <UL
          items={[
            "Our payment provider, to take payment and prevent fraud.",
            "Shipping carriers, to deliver your order (name, address and phone number).",
            "Email, hosting and analytics providers that support the website.",
            "Authorities or advisers when the law requires it, or to protect our rights and customers.",
          ]}
        />
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <>
        <P>
          We use cookies and similar storage to remember your cart, keep you signed in, protect your session and see how
          the site is used. You can block or delete cookies in your browser settings, but parts of the shop, such as the
          cart and checkout, may not work properly without them.
        </P>
      </>
    ),
  },
  {
    id: "your-choices",
    title: "Your choices and rights",
    body: (
      <>
        <P>
          You can ask us at any time to access, correct or delete the personal information we hold about you, or to stop
          sending you emails. Depending on where you live, including California, you may have additional rights under
          local privacy laws, such as knowing what we collect and requesting deletion. To make a request, email{" "}
          <a className="font-semibold text-[#8f6f3a] underline underline-offset-4" href={`mailto:${SITE_CONTACT.email}`}>
            {SITE_CONTACT.email}
          </a>
          . We may need to verify your identity before acting on it.
        </P>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect your information",
    body: (
      <>
        <P>
          We use reasonable technical and organizational measures, including encrypted connections, to protect your
          information. No website or transmission is completely secure, so we cannot guarantee absolute security.
        </P>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <>
        <P>
          Our website is not directed to children under 13, and we do not knowingly collect their personal information.
          If you believe a child has given us information, please contact us and we will delete it.
        </P>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <>
        <P>
          We may update this policy from time to time. The “Last updated” date at the top shows when it last changed.
          Material changes will be posted on this page. Questions? See our{" "}
          <Link className="font-semibold text-[#8f6f3a] underline underline-offset-4" href="/terms">Terms &amp; Conditions</Link>{" "}
          or <Link className="font-semibold text-[#8f6f3a] underline underline-offset-4" href="/contact">contact us</Link>.
        </P>
        <Note>This page is a general privacy notice. It is not legal advice.</Note>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      kicker="Your data, protected"
      title="Privacy"
      accent="Policy"
      intro="What we collect, why we collect it, and how we keep your information safe, in plain language."
      updated="October 2026"
      highlights={[
        { title: "We never sell your data", text: "Your details are used to run your order and support you, nothing else." },
        { title: "Payments stay with Stripe", text: "Card details go straight to Stripe. We never see or store your full card number." },
        { title: "You stay in control", text: "Ask us to access, correct or delete your information any time." },
      ]}
      sections={sections}
      contactTitle="Privacy question or data request?"
    />
  );
}
