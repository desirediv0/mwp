"use client";

import Link from "next/link";
import Image from "next/image";
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
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";

const WHATSAPP_NUMBER = "917678336268";

export const Footer = () => {
  const { t } = useLanguage();

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

  const socials = [
    { href: "https://www.instagram.com/mwpsupplements", Icon: IconBrandInstagram, label: "Instagram" },
    { href: "https://www.facebook.com/mwpsupplements", Icon: IconBrandFacebook, label: "Facebook" },
    { href: `https://wa.me/${WHATSAPP_NUMBER}`, Icon: IconBrandWhatsapp, label: "WhatsApp" },
  ];

  return (
    <footer className="relative bg-black text-white overflow-hidden">
      {/* Faint echo of the hero image — ties the footer visually to the top of the page */}
      <Image
        src="/mwp-hero-bg.png"
        alt=""
        fill
        className="object-cover object-top opacity-[0.08] pointer-events-none select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black pointer-events-none" />
      {/* Ambient top glow — echoes the hero, ties the page together */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[300px] bg-white/[0.04] blur-[160px] rounded-full pointer-events-none" />

      {/* Centered brand block */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <Image
          src="/logo.png"
          alt="MWP SUPPLEMENTS"
          width={180}
          height={72}
          className="h-16 sm:h-20 w-auto object-contain mx-auto mb-5 opacity-95"
        />
        <p className="text-[11px] uppercase tracking-[0.4em] text-white/40 font-semibold mb-6">
          Men &bull; Women &bull; Power
        </p>
        <p className="text-[13px] text-neutral-400 max-w-md mx-auto leading-relaxed">
          Premium global wellness formulas, engineered for everyday performance —
          clinically dosed, third-party tested, made to earn your trust.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          {socials.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-white hover:border-white/20 transition-all"
            >
              <Icon className="h-4 w-4" stroke={2} />
            </a>
          ))}
        </div>
      </div>

      {/* Trust strip — quiet, no boxes */}
      <div className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-neutral-500">
              <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Link columns */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-14 pb-12 border-t border-white/[0.06]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-12">
          <FooterCol title={t("products")}>
            {productLinks.map((l) => (
              <FooterLink key={l.label} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Explore">
            {companyLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>

          <FooterCol title="Customer Care">
            {careLinks.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterCol>
        </div>

        {/* Contact row */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6 text-[13px]">
          <a href="tel:+917678336268" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
            <IconPhone className="h-4 w-4 shrink-0" stroke={1.75} />
            <span>+91 76783 36268</span>
          </a>
          <a href="mailto:support@mwpsupplements.com" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors">
            <IconMail className="h-4 w-4 shrink-0" stroke={1.75} />
            <span className="break-all">support@mwpsupplements.com</span>
          </a>
          <div className="flex items-center gap-3 text-neutral-500">
            <IconMapPin className="h-4 w-4 shrink-0" stroke={1.75} />
            <span>Pan-India Priority Express Shipping</span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/[0.06] py-6">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-neutral-500 tracking-wide text-center md:text-left">
            &copy; {new Date().getFullYear()} MWP Supplements. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {[
              { name: "Visa", src: "/visa.png" },
              { name: "Mastercard", src: "/mc.png" },
              { name: "UPI", src: "/upi.png" },
            ].map((item) => (
              <div
                key={item.name}
                className="px-2 py-1 bg-white rounded-md flex items-center justify-center h-6 min-w-[36px] opacity-80"
                title={item.name}
              >
                <img src={item.src} alt={item.name} className="h-3.5 w-auto object-contain max-w-[26px]" />
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
      <h4 className="text-[12px] font-semibold text-white mb-5">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] text-neutral-400 hover:text-white transition-colors duration-200 inline-block"
      >
        {children}
      </Link>
    </li>
  );
}

export default Footer;
