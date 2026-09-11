"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  IconGift,
  IconBuilding,
  IconSparkles,
  IconCheck,
  IconArrowRight,
  IconSend,
  IconPackage,
  IconClock,
  IconTruck,
  IconAward,
  IconHeart,
  IconPhone,
  IconMail,
  IconWorld,
  IconRosette,
  IconCalculator,
  IconChecklist,
  IconCircleCheck,
  IconFileText,
  IconPalette,
  IconFlask,
  IconShieldCheck,
  IconUserCheck,
  IconLeaf,
  IconSearch,
  IconRefresh
} from "@tabler/icons-react";
import { toast } from "sonner";
import Reveal from "@/components/ui/Reveal";

export default function CorporateGiftingPage() {
  const formRef = useRef(null);
  const [activePriceTab, setActivePriceTab] = useState("bottle"); // "bottle" | "package" | "gst"
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    quantity: "50-100",
    bottleSize: "50ml",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thank you! Our Corporate Gifting Concierge will reach out to you shortly.");
  };

  // Pricing Data from PDF
  const pricingData = {
    bottle: [
      { size: "30 ML", u50: "₹375", u100: "₹343.50", u500: "₹316", u1000: "₹293", u2000: "₹268" },
      { size: "50 ML", u50: "₹400", u100: "₹368.50", u500: "₹340", u1000: "₹317", u2000: "₹292.50" },
      { size: "100 ML", u50: "₹481", u100: "₹448", u500: "₹419.50", u1000: "₹395.50", u2000: "₹367.50" }
    ],
    package: [
      { size: "30 ML", u50: "₹17,175", u100: "₹34,350", u500: "₹1,58,000", u1000: "₹2,93,000", u2000: "₹5,36,000" },
      { size: "50 ML", u50: "₹20,000", u100: "₹36,850", u500: "₹1,70,000", u1000: "₹3,17,000", u2000: "₹5,85,000" },
      { size: "100 ML", u50: "₹24,050", u100: "₹44,800", u500: "₹2,09,750", u1000: "₹3,95,500", u2000: "₹7,35,000" }
    ],
    gst: [
      { size: "30 ML", u50: "₹20,275", u100: "₹40,533", u500: "₹1,86,440", u1000: "₹3,45,740", u2000: "₹6,32,480" },
      { size: "50 ML", u50: "₹23,600", u100: "₹43,543", u500: "₹2,00,600", u1000: "₹3,74,060", u2000: "₹6,90,300" },
      { size: "100 ML", u50: "₹28,379", u100: "₹52,864", u500: "₹2,47,505", u1000: "₹4,67,090", u2000: "₹8,67,300" }
    ]
  };

  return (
    <main className="bg-[#FAF6FF] min-h-screen text-[#26153B] font-sans selection:bg-[#D6C2F7] selection:text-[#240E42]">

      {/* ── 1. TOP HERO SECTION (Lavender Shades & Metallic Gold Accents) ── */}
      <section className="relative min-h-[90vh] pt-28 pb-20 flex items-center overflow-hidden bg-gradient-to-br from-[#FDFBFF] via-[#F3EAFC] to-[#E9D9F8]">
        
        {/* Background Floating Lavender Orbs & Accents */}
        <div 
          className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-60 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(206, 177, 245, 0.45) 0%, transparent 70%)" }}
        />
        <div 
          className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(184, 151, 106, 0.25) 0%, transparent 70%)" }}
        />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B8976A]/40 bg-white/80 backdrop-blur-md text-[#5B308C] text-xs font-semibold uppercase tracking-[0.25em] shadow-sm">
                  <IconSparkles className="w-3.5 h-3.5 text-[#B8976A]" />
                  Corporate Gifting Catalogue 2026
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#240E42] tracking-tight leading-[1.05] font-normal">
                  Corporate <br className="hidden sm:block" />
                  <em className="text-[#6533A3] italic font-serif">Gifting</em>
                </h1>
              </Reveal>

              {/* Thin Gold Divider & Subheading */}
              <Reveal delay={0.15}>
                <div className="flex items-center justify-center lg:justify-start gap-4">
                  <span className="h-px w-12 bg-[#B8976A]" />
                  <h2 className="text-xs sm:text-sm uppercase tracking-[0.3em] font-bold text-[#7E52BC]">
                    Through the Language of Fragrance
                  </h2>
                  <span className="h-px w-12 bg-[#B8976A] hidden sm:block" />
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-base sm:text-lg text-[#4E3966] font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Personalized fragrances, signature brand scents, and memorable gifting experiences for employees, clients, and corporate milestones.
                </p>
              </Reveal>

              {/* Horizontal Trust Badges */}
              <Reveal delay={0.25}>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                  {["Made in India", "Women-Owned Startup", "100% Handcrafted"].map((badge, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-[#E0D0F5] text-[#7048A0] text-[11px] font-semibold uppercase tracking-wider rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8976A]" />
                      {badge}
                    </span>
                  ))}
                </div>
              </Reveal>

              {/* Feature Chips */}
              <Reveal delay={0.25}>
                <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-2">
                  {[
                    "EMPLOYEE APPRECIATION",
                    "CLIENT GIFTING",
                    "FESTIVAL HAMPERS",
                    "SIGNATURE COMPANY FRAGRANCES"
                  ].map((chip) => (
                    <span 
                      key={chip}
                      className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#D9C8F5] text-[#4A267A] text-[11px] font-semibold tracking-wider rounded-full shadow-sm hover:border-[#B8976A] hover:bg-white transition-all duration-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </Reveal>

              {/* CTA Button */}
              <Reveal delay={0.3}>
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={scrollToForm}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#4A2478] hover:bg-[#38195E] text-white text-xs uppercase tracking-[0.2em] font-medium rounded-full shadow-xl shadow-[#4A2478]/25 hover:shadow-2xl transition-all duration-300 group"
                  >
                    Explore Corporate Gifting
                    <IconArrowRight className="w-4 h-4 text-[#EAD5AB] group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="#pricing-section"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/80 hover:bg-white text-[#4A2478] border border-[#D9C8F5] text-xs uppercase tracking-[0.2em] font-medium rounded-full transition-all duration-300"
                  >
                    View Pricing
                  </a>
                </div>
              </Reveal>
            </div>

            {/* Right Column: Floating Corporate Gifting Visual */}
            <div className="lg:col-span-5 relative flex justify-center w-full">
              <Reveal delay={0.2} className="w-full flex justify-center">
                <div className="relative w-full max-w-[540px] aspect-[16/11] rounded-3xl overflow-hidden p-3 sm:p-4 bg-white/90 border border-white shadow-2xl backdrop-blur-md">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner group">
                    <Image
                      src="/corporate.jpeg"
                      alt="MWP Supplements Luxury Corporate Perfume Gifting"
                      fill
                      sizes="(max-width: 768px) 100vw, 540px"
                      className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                      priority
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3C1A60]/50 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Bottom floating badge */}
                    <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg text-center z-10">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#B8976A] font-bold block mb-0.5">
                        Atelier Bespoke Perfumery
                      </span>
                      <p className="font-serif text-xs sm:text-sm text-[#240E42] font-semibold">
                        Custom Co-Branded Flacons & Gift Sets
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>


      {/* ── 2. OUR STORY SECTION (Creative Dual Card Layout from PDF Image 1) ── */}
      <section className="py-20 md:py-28 bg-[#F5EEFE] border-t border-[#E8DAFA] relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16">

          <Reveal>
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs uppercase tracking-[0.35em] text-[#B8976A] font-bold block">
                Made In India • Women Owned Startup • Handcrafted
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#240E42]">
                OUR STORY
              </h2>
              <div className="w-16 h-px bg-[#B8976A] mx-auto" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Story Card Left */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-12 rounded-3xl border border-[#E4D5F8] shadow-lg space-y-6 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Image src="/logo.png" alt="MWP SUPPLEMENTS" width={110} height={35} className="h-7 w-auto" />
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl text-[#3C1D68] font-normal">
                      ROOTED IN A DREAM. <br />
                      <span className="text-[#B8976A] italic">BUILT WITH PURPOSE.</span>
                    </h3>

                    <p className="text-sm sm:text-base text-[#4E3966] font-light leading-relaxed">
                      MWP Supplements was born not in a boardroom, but in a small corner of our home. It began as our founder&apos;s <strong className="font-semibold text-[#240E42]">retirement plan</strong>—a quiet dream to do something <strong className="font-semibold text-[#240E42]">meaningful</strong>, something that brings joy to people.
                    </p>

                    <p className="text-sm sm:text-base text-[#4E3966] font-light leading-relaxed">
                      With a deep love for fragrances, creativity, and thoughtful gifting, that dream took shape. What started as handmade gifts for family and friends, soon turned into smiles, orders, and endless encouragement.
                    </p>

                    <p className="text-sm sm:text-base text-[#5B308C] font-semibold italic border-l-2 border-[#B8976A] pl-4 py-1">
                      That&apos;s when we knew—this wasn&apos;t just a plan. This was our purpose.
                    </p>
                  </div>

                  {/* 3 Core Belief Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#EAE2FA]">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#3C1D68] block">PROUDLY MADE IN INDIA</span>
                      <p className="text-[11px] text-[#634E7D] font-light">Supporting local craftsmanship & empowering artisans across India.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#3C1D68] block">CARRIES A DREAM</span>
                      <p className="text-[11px] text-[#634E7D] font-light">A dream of a founder, of artisans, and of a nation that creates.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#3C1D68] block">JOY OF GIVING</span>
                      <p className="text-[11px] text-[#634E7D] font-light">Celebrating relationships, emotions, and meaningful gifting.</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Belief Card Right */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <Reveal delay={0.15}>
                <div className="bg-gradient-to-br from-[#F2E7FE] to-[#E5D2FA] p-8 sm:p-10 rounded-3xl border border-[#DBC4F7] shadow-lg space-y-5">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#825BB5]">Corporate Philosophy</span>
                  <h4 className="font-serif text-2xl text-[#240E42]">MORE THAN A BRAND, A BELIEF.</h4>
                  
                  <div className="space-y-3 text-xs sm:text-sm text-[#4E3966] font-light leading-relaxed">
                    <p>✨ We believe little things can create big emotions.</p>
                    <p>✨ We believe in quality over quantity, relationships over transactions, and thoughtfulness over trends.</p>
                    <p>✨ We believe in the power of Make in India—in our skilled artisans, our rich heritage, and the spirit of a new India that creates, innovates, and inspires the world.</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="p-6 rounded-2xl bg-white border border-[#B8976A]/40 shadow-sm text-center space-y-2">
                  <p className="font-serif text-xs sm:text-sm italic text-[#3C1D68] leading-relaxed">
                    &quot;When you choose MWP Supplements, you don&apos;t just choose a gift. You choose passion. You choose purpose. You choose India. ❤️&quot;
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#B8976A] block">
                    LET&apos;S MAKE GIFTING MEANINGFUL
                  </span>
                </div>
              </Reveal>
            </div>

          </div>
        </div>
      </section>
      {/* ── 3. OUR USP & OFFERINGS (From PDF Image 2) ── */}
      <section className="py-20 md:py-28 bg-[#FAF5FF] relative border-t border-[#ECE0FA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 space-y-16">

          <Reveal>
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[#B8976A] font-bold block">
                OUR UNIQUE SELLING PROPOSITION
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#240E42]">
                Thoughtful Gifts. Lasting Impressions.
              </h2>
              <p className="text-sm sm:text-base text-[#5C457A] max-w-xl mx-auto font-light">
                FRAGRANCES THAT REPRESENT YOUR BRAND, YOUR VALUES & YOUR STORY.
              </p>
              <div className="w-16 h-px bg-[#B8976A] mx-auto mt-4" />
            </div>
          </Reveal>

          {/* 6 USP Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: IconPackage,
                title: "CO-BRANDED PACKAGING",
                desc: "Premium packaging personalized with your company logo, brand colors and visual identity."
              },
              {
                icon: IconAward,
                title: "CO-BRANDED LABEL",
                desc: "Custom labels with your logo, brand elements and special appreciation message."
              },
              {
                icon: IconSparkles,
                title: "SIGNATURE COMPANY SCENT",
                desc: "A fragrance crafted exclusively for your brand that becomes your unique olfactory signature."
              },
              {
                icon: IconGift,
                title: "FESTIVAL THEMES",
                desc: "Curated festive editions for Diwali, New Year, Holi and corporate celebrations."
              },
              {
                icon: IconHeart,
                title: "A CARD WITH MESSAGE",
                desc: "Personalized message cards that add warmth, gratitude and a human touch to every gift."
              },
              {
                icon: IconShieldCheck,
                title: "PREMIUM QUALITY, LASTING IMPACT",
                desc: "Long-lasting fragrances crafted with the finest ingredients for an unforgettable experience."
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={idx * 0.07}>
                  <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-[#E7DAFA] shadow-sm hover:shadow-xl hover:border-[#B8976A] transition-all duration-500 h-full flex flex-col justify-between group">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#F3EAFC] text-[#5B308C] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#4A2478] group-hover:text-white transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-lg text-[#240E42] mb-3 font-medium tracking-wide">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#5C4D73] leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Flexible Corporate Solutions Bar */}
          <Reveal delay={0.2}>
            <div className="bg-gradient-to-r from-[#F0E4FF] via-[#F7F0FF] to-[#F0E4FF] p-8 rounded-3xl border border-[#DECBF7] shadow-md">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-[#D6C2F7]/50">
                <div className="px-3">
                  <span className="text-xs font-bold uppercase text-[#3C1D68] block">FLEXIBLE SOLUTIONS</span>
                  <p className="text-[11px] text-[#634E7D] mt-1 font-light">Low MOQ and scalable solutions for all business sizes.</p>
                </div>
                <div className="px-3">
                  <span className="text-xs font-bold uppercase text-[#3C1D68] block">DEDICATED SUPPORT</span>
                  <p className="text-[11px] text-[#634E7D] mt-1 font-light">Single point of contact from concept to delivery.</p>
                </div>
                <div className="px-3">
                  <span className="text-xs font-bold uppercase text-[#3C1D68] block">PAN-INDIA DELIVERY</span>
                  <p className="text-[11px] text-[#634E7D] mt-1 font-light">Safe, timely and reliable shipping across India.</p>
                </div>
                <div className="px-3">
                  <span className="text-xs font-bold uppercase text-[#3C1D68] block">QUALITY ASSURANCE</span>
                  <p className="text-[11px] text-[#634E7D] mt-1 font-light">Each bottle is crafted with precision and care.</p>
                </div>
                <div className="px-3 col-span-2 md:col-span-1">
                  <span className="text-xs font-bold uppercase text-[#3C1D68] block">SUSTAINABLE CHOICES</span>
                  <p className="text-[11px] text-[#634E7D] mt-1 font-light">Thoughtful packaging and responsible practices.</p>
                </div>
              </div>

              <div className="text-center pt-6 mt-6 border-t border-[#DECBF7]/60">
                <p className="font-serif text-sm italic text-[#4A2478]">
                  &quot;We don&apos;t just deliver gifts, we help you create moments that people remember.&quot;
                </p>
              </div>
            </div>
          </Reveal>

        </div>
      </section>


      {/* ── 4. THE MWP SUPPLEMENTS PROCESS (Interactive Timeline from PDF Image 3) ── */}
      <section className="py-20 md:py-28 bg-[#F4ECFC] border-t border-[#E4D5F8]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 space-y-16">

          <Reveal>
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-[0.35em] text-[#B8976A] font-bold block">
                From Brief to Delivery
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#240E42]">
                THE MWP SUPPLEMENTS PROCESS
              </h2>
              <p className="text-sm text-[#5C457A] font-light">
                A seamless journey from idea to unforgettable corporate gifting.
              </p>
              <div className="w-16 h-px bg-[#B8976A] mx-auto mt-4" />
            </div>
          </Reveal>

          {/* Process Timeline Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                day: "DAY 0",
                title: "Brand Discovery & Confirmation",
                points: ["Requirement Discussion", "Fragrance Direction", "Packaging Preferences", "Branding Requirements", "50% Advance Payment"]
              },
              {
                day: "DAY 0–2",
                title: "Creative Development",
                points: ["5 Signature Fragrance Concepts", "5 Label Design Concepts", "5 Packaging Design Concepts", "Digitally shared for review & feedback"]
              },
              {
                day: "DAY 3",
                title: "Sampling & Approval",
                points: ["Physical scent samples dispatched", "Lead Time: 5–6 Days Pan India", "Sampling cost ₹5,000 (100% Redeemable)"]
              },
              {
                day: "DAY 10+",
                title: "Production & Delivery",
                points: ["Production begins upon approval", "Rigorous quality check", "Pan-India Dispatch (4–6 Days)"]
              }
            ].map((step, idx) => (
              <Reveal key={step.day} delay={idx * 0.1}>
                <div className="bg-white p-7 rounded-3xl border border-[#E2D2FA] shadow-sm space-y-4 h-full flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#F2EAFC] to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="space-y-3 relative z-10">
                    <span className="px-3 py-1 bg-[#4A2478] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {step.day}
                    </span>
                    <h3 className="font-serif text-lg text-[#240E42] font-semibold leading-snug">
                      {step.title}
                    </h3>
                    <ul className="space-y-2 pt-2">
                      {step.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 text-xs text-[#5C4D73] font-light">
                          <IconCircleCheck className="w-3.5 h-3.5 text-[#B8976A] shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </Reveal>
            ))}
          </div>

          {/* Sampling & Timeline Highlights Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Reveal delay={0.1}>
              <div className="bg-white p-8 rounded-3xl border border-[#B8976A]/40 shadow-md space-y-3">
                <span className="text-xs uppercase tracking-widest text-[#B8976A] font-bold block">SAMPLING PROGRAM</span>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl font-bold text-[#240E42]">₹5,000</span>
                  <span className="text-xs text-[#634E7D] font-light">(Fully Redeemable on orders above 500 bottles)</span>
                </div>
                <p className="text-xs text-[#5C4D73] leading-relaxed">
                  Includes: 3 Fragrance samples physically delivered for testing + 3 Packaging box concepts digitally delivered + 3 Label concepts digitally delivered + 3 thank you card designs digitally delivered.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="bg-white p-8 rounded-3xl border border-[#E2D2FA] shadow-md space-y-3">
                <span className="text-xs uppercase tracking-widest text-[#7E52BC] font-bold block">PRODUCTION TIMELINES</span>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-xs font-semibold text-[#240E42] block">Standard Orders (up to 1,000 units)</span>
                    <span className="font-serif text-xl font-bold text-[#5B308C]">5 Working Days</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#240E42] block">Large Orders (1,000–2,000 units)</span>
                    <span className="font-serif text-xl font-bold text-[#5B308C]">7–12 Working Days</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#634E7D] italic pt-1">
                  Total Project Timeline: Approximately 2–4 Weeks depending on order volume and approvals.
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </section>


      {/* ── 5. PACKAGING FORMAT SELECTION (From PDF Image 4) ── */}
      <section className="py-20 md:py-28 bg-[#FAF5FF] border-t border-[#E8DAFA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 space-y-16">

          <Reveal>
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-[0.35em] text-[#B8976A] font-bold block">
                Choose Your Packaging Format
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#240E42]">
                Select Bottle Silhouette
              </h2>
              <p className="text-sm text-[#5C457A] font-light">
                Select the bottle silhouette that best represents your brand identity and gifting objective.
              </p>
              <div className="w-16 h-px bg-[#B8976A] mx-auto mt-4" />
            </div>
          </Reveal>

          {/* Formats Grid (30ML, 50ML, 100ML) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* 30 ML */}
            <Reveal delay={0.1}>
              <div className="bg-white p-8 rounded-3xl border border-[#E0D0FA] shadow-sm hover:shadow-xl transition-all duration-300 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-[#F0E6FF] text-[#5B308C] text-[10px] font-bold uppercase tracking-wider rounded-full">
                    MOQ: 50 Units
                  </span>
                  <h3 className="font-serif text-3xl text-[#240E42]">30 ML</h3>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#3C1D68] uppercase tracking-wider block">Perfect For:</span>
                    <ul className="text-xs text-[#5C4D73] space-y-1 font-light">
                      <li>• Event Giveaways & Conference Kits</li>
                      <li>• Employee Onboarding Packs</li>
                      <li>• Large Volume Brand Campaigns</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 bg-[#F0E6FF] hover:bg-[#4A2478] text-[#4A2478] hover:text-white text-xs uppercase tracking-widest font-semibold rounded-xl transition-colors"
                >
                  Request 30ml Quote
                </button>
              </div>
            </Reveal>

            {/* 50 ML */}
            <Reveal delay={0.2}>
              <div className="bg-gradient-to-b from-white to-[#F8F2FF] p-8 rounded-3xl border-2 border-[#B8976A] shadow-lg relative space-y-6 h-full flex flex-col justify-between">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#B8976A] text-white text-[10px] uppercase tracking-widest px-4 py-1 rounded-full font-bold shadow">
                  Most Preferred Choice
                </span>
                <div className="space-y-4 pt-2">
                  <span className="px-3 py-1 bg-[#4A2478] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    MOQ: 50 Units
                  </span>
                  <h3 className="font-serif text-3xl text-[#240E42]">50 ML</h3>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#3C1D68] uppercase tracking-wider block">Perfect For:</span>
                    <ul className="text-xs text-[#5C4D73] space-y-1 font-light">
                      <li>• Employee Appreciation & Recognition</li>
                      <li>• Festival Gifting (Diwali / New Year)</li>
                      <li>• Corporate Celebrations & Milestones</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 bg-[#4A2478] hover:bg-[#38195E] text-white text-xs uppercase tracking-widest font-semibold rounded-xl transition-colors shadow-md"
                >
                  Request 50ml Quote
                </button>
              </div>
            </Reveal>

            {/* 100 ML */}
            <Reveal delay={0.3}>
              <div className="bg-white p-8 rounded-3xl border border-[#E0D0FA] shadow-sm hover:shadow-xl transition-all duration-300 space-y-6 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="px-3 py-1 bg-[#F0E6FF] text-[#5B308C] text-[10px] font-bold uppercase tracking-wider rounded-full">
                    MOQ: 50 Units
                  </span>
                  <h3 className="font-serif text-3xl text-[#240E42]">100 ML</h3>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#3C1D68] uppercase tracking-wider block">Perfect For:</span>
                    <ul className="text-xs text-[#5C4D73] space-y-1 font-light">
                      <li>• CXO & Executive VIP Gifting</li>
                      <li>• Leadership Team Recognition</li>
                      <li>• Premium Brand Collaborations</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={scrollToForm}
                  className="w-full py-3 bg-[#F0E6FF] hover:bg-[#4A2478] text-[#4A2478] hover:text-white text-xs uppercase tracking-widest font-semibold rounded-xl transition-colors"
                >
                  Request 100ml Quote
                </button>
              </div>
            </Reveal>

          </div>

          {/* Included in Every Order Box */}
          <div className="bg-white p-8 rounded-3xl border border-[#DECBF7] shadow-sm space-y-4">
            <h4 className="font-serif text-lg text-[#240E42] text-center">EVERY CORPORATE ORDER INCLUDES:</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              {[
                "Co-Branded Labels",
                "Personalized Gift Cards",
                "Festival Packaging",
                "Custom Messaging",
                "Pan-India Delivery",
                "Dedicated Support"
              ].map((inc, i) => (
                <div key={i} className="p-3 bg-[#FAF6FF] rounded-xl border border-[#EDE0FA] text-xs font-semibold text-[#4A2478]">
                  {inc}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* ── 6. CORPORATE PRICING TABLES (From PDF Pages 5 & 6) ── */}
      <section id="pricing-section" className="py-20 md:py-28 bg-[#F3EAFB] border-t border-[#E2D2FA]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 space-y-12">

          <Reveal>
            <div className="text-center space-y-3">
              <span className="text-xs uppercase tracking-[0.35em] text-[#B8976A] font-bold block">
                Transparent Luxury Pricing
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#240E42]">
                CORPORATE PRICING
              </h2>
              <p className="text-sm text-[#5C457A] font-light max-w-xl mx-auto">
                Pricing inclusive of fragrance, bottle, co-branded label, packaging box, assembly and delivery across India. (Taxes extra @ 18% GST)
              </p>
              <div className="w-16 h-px bg-[#B8976A] mx-auto mt-4" />
            </div>
          </Reveal>

          {/* Pricing Category Switcher Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-white rounded-2xl border border-[#D9C6F5] shadow-sm">
              {[
                { id: "bottle", label: "PER BOTTLE COST" },
                { id: "package", label: "FULL PACKAGE COST" },
                { id: "gst", label: "PACKAGE COST INCL. 18% GST" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePriceTab(tab.id)}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all duration-300 ${
                    activePriceTab === tab.id
                      ? "bg-[#4A2478] text-white shadow-md"
                      : "text-[#5C4D73] hover:text-[#240E42]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Table Display */}
          <Reveal>
            <div className="bg-white rounded-3xl border border-[#DECBF7] shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#4A2478] text-white text-xs uppercase tracking-wider font-semibold">
                      <th className="py-5 px-6">BOTTLE SIZE</th>
                      <th className="py-5 px-6 text-center">50 UNITS</th>
                      <th className="py-5 px-6 text-center">100 UNITS</th>
                      <th className="py-5 px-6 text-center">500 UNITS</th>
                      <th className="py-5 px-6 text-center">1000 UNITS</th>
                      <th className="py-5 px-6 text-center bg-[#3B1963]">2000 UNITS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE0FA] text-xs sm:text-sm text-[#240E42]">
                    {pricingData[activePriceTab].map((row, rIdx) => (
                      <tr key={row.size} className={rIdx % 2 === 1 ? "bg-[#FAF6FF]" : "bg-white"}>
                        <td className="py-5 px-6 font-serif text-base font-bold text-[#4A2478]">{row.size}</td>
                        <td className="py-5 px-6 text-center font-medium">{row.u50}</td>
                        <td className="py-5 px-6 text-center font-medium">{row.u100}</td>
                        <td className="py-5 px-6 text-center font-semibold text-[#5B308C]">{row.u500}</td>
                        <td className="py-5 px-6 text-center font-bold text-[#4A2478]">{row.u1000}</td>
                        <td className="py-5 px-6 text-center font-extrabold text-[#3B1963] bg-[#F2EAFC]">{row.u2000}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-[#FAF5FF] border-t border-[#EAE0FA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5C4D73]">
                <div className="flex items-center gap-2">
                  <IconTruck className="w-4 h-4 text-[#B8976A]" />
                  <span><strong>Pan-India Delivery Included</strong> in the above pricing.</span>
                </div>
                <div>
                  <span>Taxes extra @ 18% GST where applicable.</span>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </section>


      {/* ── 7. INQUIRY FORM SECTION ── */}
      <section ref={formRef} className="py-20 md:py-28 bg-[#F6EEFD] border-t border-[#E5D5FA]">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-14 border border-[#E0D0FA] shadow-2xl">
            <div className="text-center mb-10 space-y-3">
              <span className="text-xs uppercase tracking-[0.3em] text-[#B8976A] font-bold block">
                Corporate Relations Concierge
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#240E42]">
                Request Custom Quotation
              </h2>
              <p className="text-sm text-[#5C4D73] font-light">
                Fill out the details below to receive the complete 2026 Corporate Catalogue & sample kit.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-[#F0E6FF] text-[#5B308C] rounded-full flex items-center justify-center mx-auto">
                  <IconCheck className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-[#240E42]">Inquiry Received</h3>
                <p className="text-sm text-[#5C4D73] max-w-md mx-auto">
                  Thank you for connecting with MWP Supplements. Our corporate gifting manager will reach out within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                      placeholder="Acme Enterprises"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Estimated Quantity</label>
                    <select
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                    >
                      <option value="50-100">50 - 100 Bottles</option>
                      <option value="100-500">100 - 500 Bottles</option>
                      <option value="500-1000">500 - 1000 Bottles</option>
                      <option value="1000+">1000+ Enterprise Units</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Preferred Bottle Size</label>
                    <select
                      value={formData.bottleSize}
                      onChange={(e) => setFormData({ ...formData, bottleSize: e.target.value })}
                      className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                    >
                      <option value="30ml">30 ML (Classic / Executive)</option>
                      <option value="50ml">50 ML (Minimal / Signature)</option>
                      <option value="100ml">100 ML (Prestige / Essential)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#3C1D68] font-bold mb-2">Requirement Notes</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3.5 border border-[#E2D2FA] rounded-xl text-sm text-[#241738] focus:outline-none focus:border-[#5B308C] bg-[#FAF8FC]"
                    placeholder="Occasion, branding requirements, target delivery dates..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#4A2478] hover:bg-[#38195E] text-white text-xs uppercase tracking-[0.2em] font-semibold rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Submit Quotation Request
                  <IconSend className="w-4 h-4 text-[#EAD5AB]" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>


      {/* ── 8. UNTIL WE MEET AGAIN (Footer Banner from PDF Image 6) ── */}
      <section className="py-20 bg-[#240E42] text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-5 text-center space-y-6 relative z-10">
          <Image src="/logo.png" alt="MWP SUPPLEMENTS" width={140} height={45} className="h-10 w-auto brightness-0 invert mx-auto opacity-90" />
          
          <h2 className="font-serif text-3xl sm:text-4xl text-[#EAD5AB] tracking-wide">
            UNTIL WE MEET AGAIN.
          </h2>

          <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto font-light leading-relaxed">
            Every fragrance begins with a memory. Thank you for being a part of ours.
          </p>

          <div className="w-16 h-px bg-[#B8976A] mx-auto my-6" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-xs text-[#EAD5AB] tracking-widest font-semibold pt-4">
            <a href="tel:7678336268" className="flex items-center gap-2 hover:text-white transition-colors">
              <IconPhone className="w-4 h-4 text-[#B8976A]" />
              7678336268
            </a>
            <a href="https://www.mwpsupplements.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <IconWorld className="w-4 h-4 text-[#B8976A]" />
              www.mwpsupplements.com
            </a>
            <a href="mailto:support@mwpsupplements.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <IconMail className="w-4 h-4 text-[#B8976A]" />
              support@mwpsupplements.com
            </a>
          </div>

          <p className="text-[11px] text-white/40 tracking-[0.2em] uppercase pt-8">
            Crafted in India. Shared with the World. ❤️
          </p>
        </div>
      </section>

    </main>
  );
}
