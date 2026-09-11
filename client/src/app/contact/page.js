"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { fetchApi } from "@/lib/utils";
import { toast } from "sonner";
import {
  IconMail,
  IconSend,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconArrowRight,
  IconChevronDown,
  IconBrandWhatsapp,
  IconPhone,
  IconBuildingStore,
  IconArrowUpRight,
} from "@tabler/icons-react";

/* ─── FAQ Data ──────────────────────────────────────────── */
const faqs = [
  {
    question: "What is MWP SUPPLEMENTS?",
    answer:
      "MWP SUPPLEMENTS (MEN | WOMEN | POWER) is a performance nutrition brand engineered to provide clean, clinically dosed, third-party lab tested formulations for peak strength, stamina, hormonal balance, and daily wellness.",
  },
  {
    question: "How do I place an order?",
    answer:
      "Browse our formulations, select your product or stack, and proceed to checkout. We accept all major payment methods including UPI, Cards, and Net Banking, offering secure insured shipping across India.",
  },
  {
    question: "Are MWP Supplements authentic and lab tested?",
    answer:
      "Yes. Every single batch is independently third-party lab tested for purity, heavy metals, and microbiological safety. All formulations are manufactured in GMP-certified and FSSAI-compliant facilities with zero banned substances.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 7-day return policy for unopened, sealed products in their original packaging. If you receive a damaged or defective item, please contact our concierge team within 48 hours for an immediate replacement.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently, we ship across India with plans for international expansion. For international inquiries, please reach out to our concierge team via WhatsApp or email, and we will do our best to accommodate your request.",
  },
];

/* ─── FAQ Item ──────────────────────────────────────────── */
function FAQItem({ item }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 text-left group"
      >
        <span className="text-[16px] text-gray-900 tracking-tight pr-4 group-hover:text-red-600 transition-colors duration-300">
          {item.question}
        </span>
        <IconChevronDown
          className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-red-600" : ""
            }`}
          stroke={1.5}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "max-h-60 pb-6" : "max-h-0"
          }`}
      >
        <p className="text-gray-500 text-[13px] leading-relaxed font-light tracking-wide">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

/* ─── Contact Page ──────────────────────────────────────── */
export default function ContactPage() {
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const response = await fetchApi("/content/contact", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success(response.data?.message || "Message sent successfully!");
      setFormData({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
    } catch (error) {
      toast.error(error.message || "Failed to send. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative h-[50vh] md:h-[70vh] overflow-hidden">
        <Image
          src="/contact-hero.jpg"
          alt="Contact MWP SUPPLEMENTS"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.45) 55%, rgba(10,10,10,0.15) 100%)",
          }}
        />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-5 pb-16 md:pb-24 w-full">
            <Reveal>
              <span className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-bold block mb-4">Get in Touch</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl text-white mb-5 tracking-tight">
                Contact{" "}
                <span className="text-red-500 font-black">MWP SUPPLEMENTS</span>
              </h1>
              <span className="block h-px w-16 bg-red-500 mb-5" />
              <p className="text-white/70 max-w-lg text-sm md:text-base font-normal leading-relaxed">
                Whether you need advice on supplement stacking, ingredients, or order tracking — our athlete support team is here to assist.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Contact Information ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 -mt-8 relative z-20 pb-16 md:pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Email */}
          <Reveal delay={0}>
            <a
              href="mailto:support@mwpsupplements.com"
              className="group flex flex-col items-center text-center p-7 bg-white border border-gray-200 hover:border-red-500/40 transition-all duration-500 h-full"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4 border border-gray-200 bg-gray-50 group-hover:border-red-500/30 transition-colors duration-300">
                <IconMail className="h-5 w-5 text-red-500" stroke={1.5} />
              </div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-2">
                Support Email
              </h4>
              <p className="text-[13px] text-gray-900 font-medium break-all">
                support@mwpsupplements.com
              </p>
            </a>
          </Reveal>

          {/* WhatsApp */}
          <Reveal delay={0.06}>
            <a
              href="https://wa.me/917678336268"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center text-center p-7 bg-white border border-gray-200 hover:border-red-300 transition-all duration-500 h-full"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4 border border-gray-200 bg-gray-50 group-hover:border-red-300 transition-colors duration-300">
                <IconBrandWhatsapp className="h-5 w-5 text-red-600" stroke={1.5} />
              </div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
                WhatsApp
              </h4>
              <p className="text-[13px] text-gray-900 font-medium">
                +91 76783 36268
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-red-600 font-medium group-hover:gap-2.5 transition-all duration-300">
                Chat Now
                <IconArrowUpRight className="h-3 w-3" stroke={1.5} />
              </span>
            </a>
          </Reveal>

          {/* Phone */}
          <Reveal delay={0.12}>
            <a
              href="tel:+917678336268"
              className="group flex flex-col items-center text-center p-7 bg-white border border-gray-200 hover:border-red-300 transition-all duration-500 h-full"
            >
              <div className="w-12 h-12 flex items-center justify-center mb-4 border border-gray-200 bg-gray-50 group-hover:border-red-300 transition-colors duration-300">
                <IconPhone className="h-5 w-5 text-red-600" stroke={1.5} />
              </div>
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
                Private Concierge
              </h4>
              <p className="text-[13px] text-gray-900 font-medium">
                +91 76783 36268
              </p>
              <p className="text-[11px] text-gray-500 mt-1 font-light">
                Direct Line
              </p>
            </a>
          </Reveal>

          {/* Location & Address */}
          <Reveal delay={0.18}>
            <div className="group flex flex-col p-7 bg-white border border-gray-200 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center border border-gray-200 bg-gray-50 shrink-0">
                  <IconMapPin className="h-5 w-5 text-red-600" stroke={1.5} />
                </div>
                <div className="text-left">
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">
                    Address
                  </h4>
                  <p className="text-[12px] text-gray-900 font-medium leading-snug">
                    132, Ramdaspeth, Nagpur, Maharashtra
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Contact Form + Map ────────────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Form */}
            <div className="lg:col-span-7">
              <Reveal>
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold block mb-5">Send a Message</span>
                <h2 className="text-3xl sm:text-4xl text-gray-900 tracking-tight mb-3">
                  WeWe&apos;d Love to{" "}apos;d Love to{" "}
                  <em className="italic text-red-500">Hear</em> From You
                </h2>
                <p className="text-gray-500 text-[14px] font-light mb-10 tracking-wide">
                  Our concierge team responds within 24 hours. For urgent
                  inquiries, reach us via WhatsApp.
                </p>
              </Reveal>

              <Reveal delay={0.1}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-gray-900 font-medium mb-2.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your full name"
                        className="w-full h-12 px-4 py-3 border border-gray-200 bg-white text-gray-900 text-[14px] rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-gray-900 font-medium mb-2.5">
                        Phone *
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+91 00000 00000"
                        className="w-full h-12 px-4 py-3 border border-gray-200 bg-white text-gray-900 text-[14px] rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-300 shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-gray-900 font-medium mb-2.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="you@example.com"
                      className="w-full h-12 px-4 py-3 border border-gray-200 bg-white text-gray-900 text-[14px] rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-gray-900 font-medium mb-2.5">
                      Subject
                    </label>
                    <div className="relative">
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full h-12 px-4 py-3 border border-gray-200 bg-white text-gray-900 text-[14px] rounded-lg appearance-none focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-300 shadow-sm cursor-pointer"
                      >
                        <option>General Inquiry</option>
                        <option>Order Status</option>
                        <option>Collaboration</option>
                        <option>Feedback</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <IconChevronDown className="h-4 w-4" stroke={1.5} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-gray-900 font-medium mb-2.5">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className="w-full px-4 py-3.5 border border-gray-200 bg-white text-gray-900 text-[14px] rounded-lg resize-none placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-300 shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-[12px] uppercase font-bold tracking-[0.12em] hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {formLoading ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.5} />
                    ) : (
                      <>
                        Send Message
                        <IconSend className="h-4 w-4" stroke={1.5} />
                      </>
                    )}
                  </button>
                </form>
              </Reveal>
            </div>

            {/* Support hours / channels */}
            <div className="lg:col-span-5">
              <Reveal delay={0.15}>
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold block mb-4">Support</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                  We&apos;re Here To <em className="italic text-red-600">Help</em>
                </h2>
                <p className="text-gray-500 text-[14px] mb-8 leading-relaxed">
                  Questions about dosage, stacking, ingredients, or your order? Our athlete
                  support team responds within 24 hours.
                </p>

                <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {[
                    { icon: IconClock, label: "Support Hours", value: "Mon – Sat · 10:00 AM – 7:00 PM IST" },
                    { icon: IconMail, label: "Email", value: "support@mwpsupplements.com" },
                    { icon: IconPhone, label: "Phone / WhatsApp", value: "+91 76783 36268" },
                    { icon: IconBuildingStore, label: "Dispatch", value: "GMP & FSSAI compliant facility · Pan-India express" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3.5 p-5">
                      <span className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-red-600" stroke={2} />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{label}</p>
                        <p className="text-[13.5px] font-semibold text-gray-800 mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="https://wa.me/917678336268"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[12px] uppercase tracking-wider font-bold transition-colors"
                >
                  <IconBrandWhatsapp className="h-4.5 w-4.5" stroke={2} /> Chat on WhatsApp
                </a>
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-5">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <span className="text-[10px] uppercase tracking-[0.3em] text-red-600 font-bold block mb-5">Questions</span>
              <h2 className="text-3xl sm:text-4xl text-gray-900 tracking-tight">
                Frequently{" "}
                <em className="italic text-red-500">Asked</em>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border-t border-gray-200">
              {faqs.map((faq, i) => (
                <FAQItem key={i} item={faq} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <img src="/why-us-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/70 to-black/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[280px] bg-red-600/25 blur-[130px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-5">
            Still Have Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1]">
            Talk To Our <span className="text-red-500">Support Team</span>
          </h2>
          <p className="text-white/60 text-[14px] sm:text-base max-w-xl mx-auto mb-8">
            Product advice, order help, or bulk enquiries — we respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white text-[12px] uppercase font-bold tracking-[0.12em] hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/25 transition-all"
            >
              Shop All Products <IconArrowRight className="h-4 w-4" stroke={2} />
            </Link>
            <a
              href="https://wa.me/917678336268"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white text-[12px] uppercase font-bold tracking-[0.12em] hover:bg-white/10 transition-colors"
            >
              <IconBrandWhatsapp className="h-4 w-4" stroke={2} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
