import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const PageHero = ({
  title,
  description,
  breadcrumbs = [],
  variant = "default",
  size = "md"
}) => {
  const variants = {
    default: "bg-hero-brand",
    gradient: "bg-hero-gradient",
    dark: "bg-white",
    white: "bg-white",
  };

  const sizes = {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-20 lg:py-24",
    lg: "py-14 md:py-16 ",
  };

  const isDark = false;

  return (
    <section className={`${variants[variant]} ${sizes[size]} border-b border-line/60 relative overflow-hidden`}>
      {/* Ghost serif backdrop */}
      <span
        className={`pointer-events-none select-none absolute -bottom-10 right-0 font-display italic text-[10rem] leading-none hidden lg:block text-hollow-dark`}
        aria-hidden="true"
      >
        {typeof title === "string" ? title.split(" ")[0] : ""}
      </span>

      <div className="section-container relative">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] mb-7">
            <Link
              href="/"
              className={`transition-colors text-stone hover:text-gold-dark`}
            >
              Home
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                <span className="text-gold-dark/70">·</span>
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className={`transition-colors text-stone hover:text-gold-dark`}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-noir">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className={`font-display text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight mb-5 max-w-4xl text-noir`}>
          {title}
        </h1>

        {/* Gold rule */}
        <span className="luxe-rule mb-6 !w-20" style={{ display: "block" }} />

        {/* Description */}
        {description && (
          <p className={`text-base md:text-lg font-light tracking-wide max-w-3xl leading-relaxed text-stone-dark`}>
            {description}
          </p>
        )}
      </div>
    </section>
  );
};

export default PageHero;
