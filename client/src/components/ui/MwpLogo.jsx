"use client";

import React from "react";
import Image from "next/image";

export function MwpLogo({ className = "h-9 w-auto", showTagline = true }) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Image
        src="/logo.png"
        alt="MWP SUPPLEMENTS — MEN | WOMEN | POWER"
        width={180}
        height={72}
        className="h-full w-auto object-contain"
        priority
      />
    </div>
  );
}

export default MwpLogo;
