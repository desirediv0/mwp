"use client";

import React from "react";
import Image from "next/image";

export function MwpLogo({
  className = "h-9 w-auto",
  priority = false,
  sizes = "190px",
}) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Image
        src="/mwp-logo-3.png"
        alt="MWP Supplements"
        width={779}
        height={266}
        sizes={sizes}
        className="h-full w-auto object-contain"
        priority={priority}
      />
    </div>
  );
}

export default MwpLogo;
