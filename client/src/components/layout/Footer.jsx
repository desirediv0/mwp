"use client";

import Link from "next/link";
import Image from "next/image";
import {
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
    <footer className="relative bg-white text-neutral-900 overflow-hidden border-t border-neutral-200">
      {/* Brand + link columns */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 py-14 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.2fr_0.85fr_0.95fr_0.85fr_1.2fr] gap-x-10 gap-y-12 xl:gap-x-12">
          <div className="sm:col-span-2 lg:col-span-4 xl:col-span-1">
            <Image
              src="/logo.png"
              alt="MWP SUPPLEMENTS"
              width={160}
              height={64}
              className="h-14 w-auto object-contain mb-6"
            />
            <p className="text-[13px] text-neutral-500 max-w-sm xl:max-w-xs leading-7">
              MWP connects performance, wellness and trust — clinically dosed
              formulas for men and women, engineered for everyday results.
            </p>
            <div className="mt-7 flex items-center gap-4">
              {socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all"
                >
                  <Icon className="h-4 w-4" stroke={2} />
                </a>
              ))}
            </div>
            <p className="mt-7 text-[10px] uppercase tracking-[0.3em] text-neutral-400 font-semibold">
              Men &bull; Women &bull; Power
            </p>
          </div>

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

          <FooterCol title="Let's Connect">
            <li>
              <a href="mailto:support@mwpsupplements.com" className="inline-block py-1 text-[13px] leading-6 text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap">
                support@mwpsupplements.com
              </a>
            </li>
            <li>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-block py-1 text-[13px] leading-6 text-neutral-500 hover:text-neutral-900 transition-colors">
                WhatsApp
              </a>
            </li>
            <li>
              <a href="tel:+917678336268" className="inline-block py-1 text-[13px] leading-6 text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap">
                +91 76783 36268
              </a>
            </li>
            <li>
              <Link href="/contact" className="py-1 text-[13px] leading-6 text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-2">
                Contact Us <span aria-hidden>&rarr;</span>
              </Link>
            </li>
          </FooterCol>
        </div>
      </div>

      {/* Trust strip */}
      <div className="relative z-10 border-t border-neutral-200">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-8 grid grid-cols-1 min-[400px]:grid-cols-2 md:flex md:flex-wrap items-center justify-center gap-x-12 gap-y-5">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-3 text-neutral-500">
              <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
              <span className="text-[11px] font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-neutral-200 pt-8 pb-24">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[11px] text-neutral-400 tracking-wide text-center md:text-left">
            &copy; {new Date().getFullYear()} MWP Supplements. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-8 gap-y-5">
            <div className="flex items-center gap-4">
              {[
                { name: "Visa", src: "/visa.png" },
                { name: "Mastercard", src: "/mc.png" },
                { name: "UPI", src: "/upi.png" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md flex items-center justify-center h-6 min-w-[36px]"
                  title={item.name}
                >
                  <Image src={item.src} alt={item.name} width={26} height={14} className="h-3.5 w-auto object-contain max-w-[26px]" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] leading-6 text-neutral-400">
              <Link href="/privacy-policy" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-neutral-900 transition-colors">Terms &amp; Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

function FooterCol({ title, children }) {
  return (
    <div className="min-w-0">
      <h4 className="text-[13px] font-semibold text-neutral-900 mb-6">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="text-[13px] leading-6 text-neutral-500 hover:text-neutral-900 transition-colors duration-200 inline-block py-1"
      >
        {children}
      </Link>
    </li>
  );
}

export default Footer;
