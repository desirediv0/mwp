import Link from "next/link";
import { IconLock, IconShieldCheck, IconEye, IconMail } from "@tabler/icons-react";

export const metadata = {
  title: "Privacy Policy | MWP SUPPLEMENTS",
  description:
    "Learn how MWP SUPPLEMENTS handles customer accounts, secure transactional data, and shipping compliance in accordance with standard e-commerce regulations.",
};

const principles = [
  {
    icon: IconLock,
    title: "Data Confidentiality",
    description:
      "Your contact details and order history are kept strictly confidential. We never sell or share customer data.",
  },
  {
    icon: IconShieldCheck,
    title: "Secure Encryption & Payments",
    description:
      "All payments are processed securely with PCI-DSS compliance. We do not store your credit card or payment credentials.",
  },
  {
    icon: IconEye,
    title: "Transparent Practices",
    description:
      "We are transparent about our data practices and sourcing. All formulations are manufactured in GMP-certified facilities.",
  },
];

const sections = [
  {
    title: "Introduction & Regulatory Compliance",
    body: (
      <p>
        MWP SUPPLEMENTS (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to
        protecting your privacy and personal account information. This Privacy Policy details how
        we collect, use, and safeguard your personal details, supplement orders, and payment data
        in compliance with the Information Technology Act, 2000 and other applicable consumer
        protection regulations in India.
      </p>
    ),
  },
  {
    title: "Collection of Customer & User Information",
    body: (
      <>
        <p>
          When you access MWP SUPPLEMENTS or order formulations, we collect necessary data to
          process orders safely:
        </p>
        <ul className="mt-3 space-y-2 pl-5 list-disc marker:text-neutral-400">
          <li>
            <strong className="text-neutral-900">Identity &amp; Demographics:</strong> Full name,
            telephone numbers, shipping coordinates, billing addresses, and active email contacts.
          </li>
          <li>
            <strong className="text-neutral-900">Order History:</strong> Supplement orders,
            stacks, delivery status, and invoice records.
          </li>
          <li>
            <strong className="text-neutral-900">Technical Identifiers:</strong> Log analytics,
            secure session tokens, cookies, and IP addresses to maintain shopping sessions and
            prevent fraud.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Secure Payment Gateway & Financial Data Protection",
    body: (
      <>
        <p>
          To ensure the highest level of security for your financial transactions, we integrate
          secure payment processing:
        </p>
        <ul className="mt-3 space-y-2 pl-5 list-disc marker:text-neutral-400">
          <li>All online transactions are encrypted using industry-standard 256-bit SSL certificates.</li>
          <li>
            Payment information (such as credit/debit card numbers, UPI PINs, net banking
            credentials) is processed directly on secure PCI-DSS compliant servers.
          </li>
          <li>
            <strong className="text-neutral-900">
              MWP SUPPLEMENTS does not store, capture, or have access to
            </strong>{" "}
            your sensitive financial credentials.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Usage of Customer Data",
    body: (
      <>
        <p>Collected data is processed exclusively for order processing and delivery:</p>
        <ul className="mt-3 space-y-2 pl-5 list-disc marker:text-neutral-400">
          <li>To dispatch supplement orders, performance stacks, and nutrition essentials to your designated address.</li>
          <li>
            To share shipping logs (recipient name, address, phone number) with verified courier
            partners (e.g., Blue Dart, Delhivery) for delivery.
          </li>
          <li>To dispatch order status notifications, payment receipts, or shipment tracking via WhatsApp and email.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Cookies and Session Tokens",
    body: (
      <p>
        Our platform utilizes simple security cookies and storage variables to remember your
        product cart items, keep you logged into your secure profile dashboard, and analyze
        browser usage patterns. You can choose to disable cookies through your browser settings,
        but please note that some essential parts of the shop system may not work correctly as a
        result.
      </p>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neutral-800/30 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 lg:px-10 py-16 md:py-24 text-center">
          <nav className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Privacy Policy</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <IconShieldCheck className="h-3.5 w-3.5" /> Your Data, Protected
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Privacy <span className="text-white/50">Policy</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-[14px] md:text-base leading-relaxed">
            Our guidelines for securing customer accounts, order details, and secure payment
            transactions.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 md:px-8 lg:px-10 py-12 md:py-16">
        {/* Core pillars */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {principles.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col items-center text-center hover:border-neutral-300 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5" stroke={1.75} />
              </div>
              <h3 className="text-[14px] font-bold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-gray-500 text-[11.5px] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Policy body */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-10 space-y-9">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-lg md:text-xl font-extrabold text-gray-900 mb-3 pb-3 border-b border-gray-100 flex items-center gap-2.5">
                <span className="w-1.5 h-5 bg-neutral-900 rounded-full shrink-0" />
                {s.title}
              </h2>
              <div className="text-gray-600 text-[13.5px] md:text-sm leading-relaxed">{s.body}</div>
            </div>
          ))}

          {/* Contact CTA */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-gray-900">Have privacy concerns or data requests?</p>
              <p className="text-xs text-gray-500 mt-0.5">Contact our support desk for direct assistance.</p>
            </div>
            <a
              href="mailto:support@mwpsupplements.com"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-neutral-900 px-5 py-3 rounded-xl hover:bg-neutral-800 transition-colors shrink-0"
            >
              <IconMail className="h-4 w-4" /> support@mwpsupplements.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
