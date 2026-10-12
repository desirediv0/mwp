import Link from "next/link";
import PolicyLayout, { P, UL, Note } from "@/components/layout/PolicyLayout";
import { SITE_CONTACT } from "@/lib/siteContact";

export const metadata = {
  title: "Terms & Conditions | MWP SUPPLEMENTS",
  description:
    "The terms that apply when you use mwpsupplements.com and buy MWP Supplements products: orders, payments, supplement use and more.",
};

const link = "font-semibold text-[#8f6f3a] underline underline-offset-4";

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <P>
        By visiting mwpsupplements.com, creating an account or placing an order, you agree to these Terms &amp;
        Conditions and to our <Link className={link} href="/privacy-policy">Privacy Policy</Link>. If you do not agree,
        please do not use the website. The site is operated by {SITE_CONTACT.company} (“MWP”, “we”, “us”).
      </P>
    ),
  },
  {
    id: "supplement-use",
    title: "Dietary supplements and your health",
    body: (
      <>
        <Note>
          <strong>These statements have not been evaluated by the Food and Drug Administration. These products are not
          intended to diagnose, treat, cure or prevent any disease.</strong>
        </Note>
        <UL
          items={[
            "Always follow the serving size and directions on the product label.",
            "Talk to a healthcare professional before use if you are pregnant or nursing, take medication, or have a medical condition.",
            "Keep out of reach of children and store in a cool, dry place.",
            "Results vary from person to person. Information on this site is for general education and is not medical advice.",
            "We may update formulations as science, sourcing and regulations evolve. Always read the label on the product you receive.",
          ]}
        />
      </>
    ),
  },
  {
    id: "orders-payments",
    title: "Orders, prices and payment",
    body: (
      <>
        <UL
          items={[
            "All prices are in US dollars (USD). The total you pay, including any shipping, is shown at checkout before you confirm.",
            "Payments are processed securely by Stripe. We never store your full card number.",
            "An order is accepted when we confirm it by email. We may cancel or refuse an order, for example because of a pricing or stock error, or suspected fraud, and will refund any payment taken.",
            "If a payment fails or is charged in error, the amount is refunded to your original payment method, normally within 5–7 business days.",
          ]}
        />
      </>
    ),
  },
  {
    id: "shipping-returns",
    title: "Shipping, returns and refunds",
    body: (
      <P>
        Delivery is covered in our <Link className={link} href="/shipping-policy">Shipping Policy</Link>, and returns,
        replacements and refunds in our <Link className={link} href="/return-policy">Returns &amp; Replacement Policy</Link>.
        Both form part of these terms.
      </P>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <P>
        You are responsible for keeping your login details private and for activity under your account. Give us accurate
        information and tell us if you think your account has been used without your permission. You must be at least 18
        to place an order.
      </P>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <P>Please do not:</P>
        <UL
          items={[
            "Use the site for anything unlawful, fraudulent or misleading.",
            "Try to disrupt, probe or gain unauthorized access to the site or other users’ accounts.",
            "Copy, scrape or resell our content without permission.",
          ]}
        />
      </>
    ),
  },
  {
    id: "ip",
    title: "Our content and trademarks",
    body: (
      <P>
        The MWP name, logo, product designs, text, images and other content on this site belong to {SITE_CONTACT.company}{" "}
        or its licensors and are protected by law. You may view and print pages for personal use, but may not reuse them
        commercially without our written permission.
      </P>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and limits of liability",
    body: (
      <>
        <P>
          The site and its content are provided “as is” and “as available”. To the fullest extent permitted by law, MWP
          is not liable for indirect, incidental or consequential damages arising from use of the site or products, and
          our total liability for any claim is limited to the amount you paid for the product at issue. Nothing in these
          terms limits rights you have under applicable consumer protection law.
        </P>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <P>
        These terms are governed by the laws of the United States and the state in which {SITE_CONTACT.company} is
        organized, without regard to conflict-of-law rules.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <>
        <P>
          We may update these terms from time to time; the “Last updated” date shows the latest version. Continuing to
          use the site after a change means you accept it. Questions? Email{" "}
          <a className={link} href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>.
        </P>
        <Note>This page is a general set of terms. It is not legal advice.</Note>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <PolicyLayout
      kicker="The ground rules"
      title="Terms &"
      accent="Conditions"
      intro="The simple rules for using our website and buying MWP Supplements products."
      updated="October 2026"
      highlights={[
        { title: "Clear pricing in USD", text: "Your full total, including shipping, is shown before you pay." },
        { title: "Secure payments", text: "Processed by Stripe. We never store your full card number." },
        { title: "Use as directed", text: "Dietary supplements. Follow the label and talk to your healthcare professional." },
      ]}
      sections={sections}
      contactTitle="Questions about these terms?"
    />
  );
}
