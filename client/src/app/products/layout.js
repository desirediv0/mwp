export const metadata = {
  title: "Shop All Supplements",
  description: "Shop all MWP Supplements formulas for men and women: daily vitality, energy and performance. Lab tested, made in the USA, fast shipping across the USA.",
  alternates: { canonical: "/products" },
  openGraph: { title: "Shop All Supplements", description: "Shop all MWP Supplements formulas for men and women.", url: "/products", type: "website" },
};

export default function Layout({ children }) {
  return <div className="min-h-screen bg-[#FAF8F2]">{children}</div>;
}
