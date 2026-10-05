import Link from "next/link";
import Image from "next/image";

export function PageBreadcrumb({ current }) {
  return <nav aria-label="Breadcrumb" className="mwp-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">{current}</span></nav>;
}

export function CollectionStillLife({ className = "" }) {
  return <div className={`mwp-still-life ${className}`}>
    {["ultra-pro", "daily-vitality", "her-power"].map((slug, index) => <div key={slug} className={`mwp-still-bottle mwp-still-bottle-${index}`}><Image src={`/products/cutouts/${slug}.webp`} alt={{ "ultra-pro": "MWP Ultra Pro", "daily-vitality": "MWP Daily Vitality", "her-power": "MWP Her Power" }[slug]} fill sizes="(max-width: 640px) 28vw, 180px" className="object-contain" /></div>)}
  </div>;
}

export function PageNextSteps({ title = "Find your everyday formula.", text = "Explore the MWP collection, or ask our team for help choosing.", primary = "/products", primaryLabel = "Explore products" }) {
  return <section className="mwp-next mwp-container"><div><h2>{title}</h2><p>{text}</p></div><div className="mwp-actions"><Link className="mwp-button" href={primary}>{primaryLabel}</Link><Link className="mwp-button mwp-button-outline" href="/contact">Contact our team</Link></div></section>;
}
