import { PageHero } from "@/components/ui/PageHero";
import { Shield, Eye, Lock } from "lucide-react";

export const metadata = {
    title: "Privacy Policy | MWP SUPPLEMENTS",
    description: "Learn how MWP SUPPLEMENTS handles customer accounts, secure transactional data, and shipping compliance in accordance with standard e-commerce regulations.",
};

const principles = [
    {
        icon: Lock,
        title: "Data Confidentiality",
        description: "Your contact details and order history are kept strictly confidential. We never sell or share customer data."
    },
    {
        icon: Shield,
        title: "Secure Encryption & Payments",
        description: "All payments are processed securely with PCI-DSS compliance. We do not store your credit card or payment credentials."
    },
    {
        icon: Eye,
        title: "Transparent Crafting",
        description: "We are transparent about our sourcing and custom creation. All designs are crafted in a clean, professional workshop environment."
    }
];

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <PageHero
                title="Privacy Policy"
                description="Our guidelines for securing customer accounts, order details, and secure payment transactions"
                breadcrumbs={[{ label: "Privacy Policy" }]}
                variant="default"
                size="sm"
            />

            <section className="py-16 px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">

                    {/* Top core pillars */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {principles.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-green-50 text-[#003E29] rounded-xl flex items-center justify-center mb-4">
                                    <item.icon className="h-5.5 w-5.5" />
                                </div>
                                <h3 className="font-display text-slate-900 text-sm mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Policy Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#E5E7EB] shadow-sm space-y-10">

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#003E29] rounded-full" />
                                Introduction &amp; Regulatory Compliance
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                MWP SUPPLEMENTS (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy and personal account information. This Privacy Policy details how we collect, use, and safeguard your personal details, supplement orders, and payment data in compliance with the **Information Technology Act, 2000** and other applicable consumer protection regulations in India.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Collection of Customer &amp; User Information
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                When you access MWP SUPPLEMENTS or order formulations, we collect necessary data to process orders safely:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li><strong>Identity &amp; Demographics:</strong> Full name, telephone numbers, shipping coordinates, billing addresses, and active email contacts.</li>
                                <li><strong>Order History:</strong> Supplement orders, stacks, delivery status, and invoice records.</li>
                                <li><strong>Technical Identifiers:</strong> Log analytics, secure session tokens, cookies, and IP addresses to maintain shopping sessions and prevent fraud.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Secure Payment Gateway &amp; Financial Data Protection
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                To ensure the highest level of security for your financial transactions, we integrate secure payment processing:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>All online transactions are encrypted using industry-standard **256-bit SSL certificates**.</li>
                                <li>Payment information (such as credit/debit card numbers, UPI PINs, net banking credentials) is processed directly on secure PCI-DSS compliant servers.</li>
                                <li>**MWP SUPPLEMENTS does not store, capture, or have access to** your sensitive financial credentials.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Usage of Customer Data
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Collected data is processed exclusively for order processing and delivery:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>To dispatch supplement orders, performance stacks, and nutrition essentials to your designated address.</li>
                                <li>To share shipping logs (recipient name, address, phone number) with verified courier partners (e.g., Blue Dart, Delhivery) for delivery.</li>
                                <li>To dispatch order status notifications, payment receipts, or shipment tracking via WhatsApp and email.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Cookies and Session Tokens
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Our platform utilizes simple security cookies and storage variables to remember your product cart items, keep you logged into your secure profile dashboard, and analyze browser usage patterns. You can choose to disable cookies through your browser settings, but please note that some essential parts of the shop system may not work correctly as a result.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Have privacy concerns or data requests?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Contact our support desk for direct assistance.</p>
                            </div>
                            <a
                                href="mailto:support@mwpsupplements.com"
                                className="text-xs font-semibold text-red-600 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                            >
                                support@mwpsupplements.com
                            </a>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
