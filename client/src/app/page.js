import MwpHeroSection from "@/components/sections/MwpHeroSection";
import CategoryGrid from "@/components/sections/CategoryGrid";
import { NewArrivals } from "@/components/sections/NewArrivals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import HomePageContent from "@/components/sections/HomePageContent";
import QualityPromiseSection from "@/components/sections/home/QualityPromiseSection";
import CustomerReviewsSection from "@/components/sections/home/CustomerReviewsSection";
import HomeFaqSection from "@/components/sections/home/HomeFaqSection";
import PerformanceClubCta from "@/components/sections/home/PerformanceClubCta";

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

      {/* 2. Shop By Category */}
      <CategoryGrid />

      {/* 3. New Arrivals */}
      <NewArrivals />

      {/* 4. Featured Products / Bestsellers */}
      <FeaturedProducts />

      {/* 5. Dynamic API-driven Product Carousels (Featured, Bestseller, Latest, Trending) */}
      <HomePageContent />

      {/* 6. The MWP Promise — quality & lab testing */}
      <QualityPromiseSection />

      {/* 7. Customer Reviews */}
      <CustomerReviewsSection />

      {/* 8. FAQ */}
      <HomeFaqSection />

      {/* 9. Performance Club CTA */}
      <PerformanceClubCta />
    </main>
  );
}
