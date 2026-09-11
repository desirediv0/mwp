import Link from "next/link";
import { PageHero } from "@/components/ui/PageHero";
import { Gavel, ShieldCheck, CreditCard } from "lucide-react";

export const metadata = {
    title: "Terms & Conditions | MWP SUPPLEMENTS",
    description: "Read MWP SUPPLEMENTS' Terms of Use, order policies, and secure purchasing agreements.",
};

const provisions = [
    {
        icon: Gavel,
        title: "Clinical Formulation Guidelines",
        description: "All products are formulated with standardized active extracts in accordance with GMP and FSSAI guidelines."
    },
    {
        icon: ShieldCheck,
        title: "Quality Guarantee & Lab Testing",
        description: "Every batch is independently lab-tested for potency, purity, microbiological safety, and heavy metals."
    },
    {
        icon: CreditCard,
        title: "Secure Payment Routing",
        description: "All payments are securely processed through PCI-DSS compliant infrastructure with no storage of sensitive credentials."
    }
];

export default function TermsPage() {
    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <PageHero
                title="Terms & Conditions"
                description="Custom perfume formulation policies, user agreements, payment processing terms, and craftsmanship disclaimers"
                breadcrumbs={[{ label: "Terms & Conditions" }]}
                variant="default"
                size="sm"
            />

            <section className="py-16 px-6 sm:px-8 lg:px-12">
                <div className="max-w-4xl mx-auto">

                    {/* Key terms grid */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {provisions.map((item, index) => (
                            <div key={index} className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-sm flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-green-50 text-[#003E29] rounded-xl flex items-center justify-center mb-4">
                                    <item.icon className="h-5.5 w-5.5" />
                                </div>
                                <h3 className="font-display text-slate-900 text-sm mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Terms Details */}
                    <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#E5E7EB] shadow-sm space-y-10">

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-[#003E29] rounded-full" />
                                User Agreement & Acceptance
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                By visiting MWP SUPPLEMENTS, registering an account, purchasing items, or accessing our content, you explicitly accept these Terms and Conditions. These terms govern your use of the website and constitute a binding legal agreement between you and MWP SUPPLEMENTS. If you do not agree to these terms, please do not use the platform.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Product Formulations &amp; Usage
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                For all dietary supplements and performance formulations:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>All products are dietary supplements, not intended to diagnose, treat, cure, or prevent any medical condition.</li>
                                <li>Always adhere to the recommended serving sizes indicated on product labels. Consult a healthcare practitioner prior to use if you have existing health conditions.</li>
                                <li>We reserve the right to modify formulations as scientific research and regulatory standards evolve.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Payments, Fees & Secure Processing
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                Online transactions on MWP SUPPLEMENTS are processed using secure encrypted payment gateway infrastructure:
                            </p>
                            <ul className="space-y-2 pl-5 list-disc text-xs md:text-sm text-slate-600">
                                <li>We accept major Credit Cards, Debit Cards, Net Banking, UPI, and authorized Wallets.</li>
                                <li>All payments are billed in Indian Rupees (INR). You agree to pay the complete price listed at checkout, including any shipping fees.</li>
                                <li>In the event of payment failure or technical error, the transaction may be rolled back, and any debited amount will be refunded directly within 5–7 business days.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Product Returns &amp; Refund Policy
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Please refer to our{" "}
                                <Link href="/return-policy" className="text-red-600 font-semibold underline hover:text-red-700">
                                    Returns and Refund policy
                                </Link>.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Supplement Disclaimer
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                The informational content presented on MWP SUPPLEMENTS is for educational purposes. Exercise, diet, and supplementation results vary between individuals. Please read labels carefully before use.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-red-500 rounded-full" />
                                Governing Law & Jurisdiction
                            </h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                These Terms and Conditions shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in India.
                            </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Have questions about our terms?</p>
                                <p className="text-xs text-slate-500 mt-0.5">Our support desk is active daily to resolve your queries.</p>
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
