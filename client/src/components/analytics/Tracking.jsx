"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Fires page views on client-side navigation (the first view is sent by the base snippets)
function RouteEvents() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (typeof window === "undefined" || !window.__trackingReady) {
      if (typeof window !== "undefined") window.__trackingReady = true;
      return;
    }
    const url = `${pathname}${search?.toString() ? `?${search}` : ""}`;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "page_view", page_path: url });
    if (typeof window.gtag === "function" && GA_ID && !GTM_ID) window.gtag("event", "page_view", { page_path: url });
    if (typeof window.fbq === "function") window.fbq("track", "PageView");
  }, [pathname, search]);
  return null;
}

export default function Tracking() {
  if (!GTM_ID && !GA_ID && !PIXEL_ID) return null;
  return (
    <>
      {GTM_ID && (
        <Script id="gtm" strategy="afterInteractive">{`
          window.__gtmLoaded = true;
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
          j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
        `}</Script>
      )}
      {GA_ID && !GTM_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: true });
          `}</Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}</Script>
      )}
      <Suspense fallback={null}>
        <RouteEvents />
      </Suspense>
    </>
  );
}

export function TrackingNoscript() {
  return (
    <>
      {GTM_ID && (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="gtm" />
        </noscript>
      )}
      {PIXEL_ID && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
        </noscript>
      )}
    </>
  );
}
