import Link from "next/link";
import { fetchApi } from "@/lib/utils";

export const revalidate = 300;

export const metadata = {
  title: "Shop All Supplements",
  description: "Shop all eight MWP Supplements formulas for men and women: daily vitality, energy and performance. Fast shipping across the USA.",
  alternates: { canonical: "/products" },
  openGraph: { title: "Shop All Supplements", description: "Shop all eight MWP Supplements formulas for men and women.", url: "/products", type: "website" },
};

export default async function Layout({ children }) {
  let products = [];
  try {
    const res = await fetchApi("/public/products?limit=100");
    products = res?.data?.products || [];
  } catch {
    products = [];
  }
  return (
    <div className="min-h-screen bg-white">
      {children}
      {products.length > 0 && (
        <nav aria-label="All MWP Supplements formulas" className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">All formulas</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-neutral-700">
            {products.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} className="underline-offset-4 hover:underline">{p.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
