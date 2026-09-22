import MwpHeroSection from "@/components/sections/MwpHeroSection";
import CategoryGrid from "@/components/sections/CategoryGrid";
import HomePromoBanners from "@/components/sections/HomePromoBanners";
import { NewArrivals } from "@/components/sections/NewArrivals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import HomeLargeCtaBanner from "@/components/sections/HomeLargeCtaBanner";
import HomePageContent from "@/components/sections/HomePageContent";
import QualityPromiseSection from "@/components/sections/home/QualityPromiseSection";
import CustomerReviewsSection from "@/components/sections/home/CustomerReviewsSection";
import HomeFaqSection from "@/components/sections/home/HomeFaqSection";
// import PerformanceClubCta from "@/components/sections/home/PerformanceClubCta";

export const metadata = {
  title: "MWP SUPPLEMENTS — Men | Women | Power | Precision Sports Nutrition",
  description:
    "MWP SUPPLEMENTS delivers clinical-grade performance nutrition. Explore our 6 flagship formulations: Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy, and Daily Boost.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* 1. Banner (dark hero) */}
      <MwpHeroSection />

      {/* 2. New Arrivals */}
      <NewArrivals />

      {/* 3. Shop By Category */}
      <CategoryGrid />

      {/* 4. Promotional 3-Card Banner Grid */}
      <HomePromoBanners />

      {/* 5. Featured Products / Bestsellers */}
      <FeaturedProducts />

      {/* 6. Large Commercial Showcase / CTA Banner */}
      <HomeLargeCtaBanner />

      {/* 7. Dynamic API-driven Product Carousels (Featured, Bestseller, Latest, Trending) */}
      <HomePageContent />

      {/* 6. The MWP Promise — quality & lab testing */}
      <QualityPromiseSection />

      {/* 7. Customer Reviews */}
      <CustomerReviewsSection />

      {/* 8. FAQ */}
      <HomeFaqSection />

      {/* 9. Performance Club CTA */}
      {/* <PerformanceClubCta /> */}
    </main>
  );
}
