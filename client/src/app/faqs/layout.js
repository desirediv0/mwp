import { fetchApi } from "@/lib/utils";
import { jsonLd } from "@/lib/seo";

export const revalidate = 600;

export const metadata = {
  title: "Supplement FAQs: Shipping, Returns & Ingredients",
  description: "Answers about MWP Supplements formulas, ingredients, shipping across the USA, returns and payments.",
  alternates: { canonical: "/faqs" },
  openGraph: { title: "Supplement FAQs: Shipping, Returns & Ingredients", description: "Answers about formulas, shipping, returns and payments.", url: "/faqs", type: "website" },
};

const plain = (html = "") => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default async function Layout({ children }) {
  let faqs = [];
  try {
    const res = await fetchApi("/faqs");
    faqs = (res?.data?.faqs || []).filter((f) => f.isPublished !== false && f.question && f.answer);
  } catch {
    faqs = [];
  }
  const ld = faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.slice(0, 50).map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plain(f.answer) } })),
      }
    : null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />}
      {children}
    </>
  );
}
