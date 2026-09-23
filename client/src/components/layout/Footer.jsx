"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import { toast } from "sonner";
import {
  IconMail,
  IconPhone,
  IconMapPin,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandWhatsapp,
  IconLeaf,
  IconFlask2,
  IconShieldCheck,
  IconTrophy,
  IconArrowRight,
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";

const WHATSAPP_NUMBER = "917678336268";

export const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const TRUST = [
    { icon: IconLeaf, label: t("premiumIngredients") },
    { icon: IconFlask2, label: t("qualityTested") },
    { icon: IconShieldCheck, label: t("trustedFormula") },
    { icon: IconTrophy, label: t("madeForResults") },
  ];

  const productLinks = [
    { label: "MWP Ultra Pro", href: "/products?search=ultra%20pro" },
    { label: "MWP Power Max", href: "/products?search=power%20max" },
    { label: "MWP Rapid Boost", href: "/products?search=rapid%20boost" },
    { label: "MWP Her Power", href: "/products?search=her%20power" },
    { label: "MWP Her Energy", href: "/products?search=her%20energy" },
    { label: "MWP Daily Vitality", href: "/products?search=daily" },
  ];

  const companyLinks = [
    { label: t("ingredients"), href: "/ingredients" },
    { label: t("university"), href: "/university" },
    { label: t("founderLetter"), href: "/founder" },
    { label: t("certificateWall"), href: "/certificates" },
    { label: t("findYourFormula"), href: "/quiz" },
    { label: t("contact"), href: "/contact" },
  ];

  const careLinks = [
    { label: t("returnPolicy"), href: "/return-policy" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "FAQs", href: "/faqs" },
    { label: "Track Order", href: "/account/orders" },
  ];

  useEffect(() => {
    // keep newsletter endpoint warm-check optional; no category fetch needed
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await fetchApi("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch {
      /* treat as success for UX */
    }
    setSubscribed(true);
    toast.success("Subscribed! Watch your inbox for a welcome code.");
  };

  return (
    <footer className="relative bg-[#0A0A0A] text-white">
      {/* Trust strip */}
      <div className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2.5 py-5 px-3 text-center">
              <Icon className="h-5 w-5 text-red-500 shrink-0" stroke={1.75} />
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-neutral-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-10 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Join the <span className="text-red-500">MWP Performance Club</span>
            </h3>
            <p className="text-[13px] text-neutral-400 mt-1.5">
              Get latest updates and offers
            </p>
          </div>
          {subscribed ? (
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold px-4 py-3">
              <IconShieldCheck className="h-5 w-5" /> You&apos;re in.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex gap-2.5">
              <div className="relative flex-1 lg:w-80">
                <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-12 pl-10 pr-4 bg-white/[0.06] border border-white/12 text-[13px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 focus:ring-4 focus:ring-white/10 transition-all"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 h-12 px-5 bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
              >
                Subscribe <IconArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-14 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link href="/" className="inline-block mb-5">
              <Image src="/logo.png" alt="MWP SUPPLEMENTS" width={180} height={72} className="h-11 w-auto object-contain" />
            </Link>
            <p className="text-[13px] text-neutral-400 leading-relaxed mb-2 max-w-sm">
              MWP SUPPLEMENTS — Men | Women | Power. Premium global wellness formulas
              engineered for vitality, performance and clean daily power.
            </p>
            <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-red-400 mb-6">
              Men • Women • Power
            </p>
            <div className="flex gap-2.5">
              {[
                { href: "https://www.instagram.com/mwpsupplements", Icon: IconBrandInstagram, label: "Instagram" },
                { href: "https://www.facebook.com/mwpsupplements", Icon: IconBrandFacebook, label: "Facebook" },
                { href: `https://wa.me/${WHATSAPP_NUMBER}`, Icon: IconBrandWhatsapp, label: "WhatsApp" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 bg-white/[0.05] border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white hover:border-white/20 transition-all"
                >
                  <Icon className="h-4 w-4" stroke={2} />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <FooterCol title={t("products")}>
            {productLinks.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>

          {/* Company */}
          <FooterCol title="Explore">
            {companyLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>

          {/* Care */}
          <FooterCol title="Customer Care">
            {careLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>
        </div>

        {/* Contact row */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px]">
          <a href="tel:+917678336268" className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors">
            <span className="w-9 h-9 bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              <IconPhone className="h-4 w-4 text-white" stroke={2} />
            </span>
            <span className="font-semibold">+91 76783 36268</span>
          </a>
          <a href="mailto:support@mwpsupplements.com" className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors">
            <span className="w-9 h-9 bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              <IconMail className="h-4 w-4 text-white" stroke={2} />
            </span>
            <span className="font-semibold break-all">support@mwpsupplements.com</span>
          </a>
          <div className="flex items-center gap-3 text-neutral-400">
            <span className="w-9 h-9 bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
              <IconMapPin className="h-4 w-4 text-white" stroke={2} />
            </span>
            <span>Pan-India Priority Express Shipping</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.06] py-6 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-500 tracking-wider uppercase font-medium text-center md:text-left">
            &copy; {new Date().getFullYear()} MWP SUPPLEMENTS &bull; Men | Women | Power &bull; All Rights Reserved
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-neutral-600 font-bold">Secure Payments</span>
            {[
              { name: "Visa", src: "/visa.png" },
              { name: "Mastercard", src: "/mc.png" },
              { name: "UPI", src: "/upi.png" },
            ].map((item) => (
              <div
                key={item.name}
                className="px-2 py-1 bg-white border border-white/20 flex items-center justify-center h-7 min-w-[40px]"
                title={item.name}
              >
                <img src={item.src} alt={item.name} className="h-4 w-auto object-contain max-w-[30px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

function FooterCol({ title, children }) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-white mb-5 flex items-center gap-2">
        <span className="w-1.5 h-3.5 bg-red-600" />
        {title}
      </h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children, highlighted }) {
  return (
    <li>
      <Link
        href={href}
        className={
          highlighted
            ? "inline-flex text-[13px] font-bold px-2.5 py-1.5 bg-white/15 border border-white/15 text-neutral-300 hover:bg-white hover:text-white transition-all"
            : "text-[13px] text-neutral-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
        }
      >
        {children}
      </Link>
    </li>
  );
}

export default Footer;
