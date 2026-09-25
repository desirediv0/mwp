import MwpHomeHero from "@/components/sections/home/MwpHomeHero";
import MwpProductShowcase from "@/components/sections/home/MwpProductShowcase";

export const metadata = {
  title: "MWP SUPPLEMENTS — Men | Women | Power",
  description:
    "Premium global wellness formulas for Men, Women & Power. Discover Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy and Daily Vitality.",
};

// Homepage per brand brief: Header (global) + hero + six product tiles + Footer (global).
// Header/Footer render in the root layout via SiteChrome — this page owns hero + grid.
export default function Home() {
  return (
    <>
      <MwpHomeHero />
      <MwpProductShowcase />
    </>
  );
}
