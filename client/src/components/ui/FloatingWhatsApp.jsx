"use client";

import { IconBrandWhatsapp } from "@tabler/icons-react";

export const FloatingWhatsApp = () => {
  const phoneNumber = "917678336268";
  const message = encodeURIComponent(
    "Hello MWP SUPPLEMENTS, I'd like to know more about your performance nutrition formulas."
  );
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 inline-flex items-center"
      aria-label="Chat on WhatsApp"
    >
      {/* label (desktop hover) */}
      <span className="hidden sm:block mr-3 px-3 py-2 rounded-lg bg-white text-gray-800 text-[12px] font-bold shadow-lg border border-gray-100 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 whitespace-nowrap">
        Chat with us
      </span>

      {/* button */}
      <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-[0_10px_30px_-6px_rgba(37,211,102,0.6)] group-hover:scale-105 group-active:scale-95 transition-transform duration-300">
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40" />
        <IconBrandWhatsapp className="relative h-7 w-7 text-white" stroke={2.2} />
      </span>
    </a>
  );
};

export default FloatingWhatsApp;
