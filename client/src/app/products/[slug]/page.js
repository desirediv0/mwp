import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { SITE_URL, absoluteUrl, plainText } from "@/lib/seo";
import ProductContent from "./ProductContent";

export const revalidate = 300;

const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

// One fetch per request, shared by metadata, JSON-LD and the page
const getProduct = cache(async (slug) => {
    try {
        const response = await fetchApi(`/public/products/${slug}`);
        return response?.data?.product || null;
    } catch {
        return null;
    }
});

const plain = plainText;

export async function generateMetadata({ params }) {
    const product = await getProduct(params.slug);
    if (!product) return { title: "Product not found", robots: { index: false } };

    const title = product.metaTitle || `${product.name} | Buy Online in the USA`;
    const description = (product.metaDescription || plain(product.shortDescription || product.description) || `Shop ${product.name} from MWP Supplements. Ships across the USA.`).slice(0, 300);
    const image = product.images?.length ? getImageUrl(product.images[0].url) : null;
    const url = absoluteUrl(`/products/${product.slug}`);

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: "MWP SUPPLEMENTS", type: "website", locale: "en_US", images: image ? [{ url: image, alt: product.name }] : [] },
        twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
    };
}

function productJsonLd(product) {
    const variants = (product.variants || []).filter((v) => v.isActive);
    const prices = variants.map((v) => parseFloat(v.salePrice && parseFloat(v.salePrice) < parseFloat(v.price) ? v.salePrice : v.price)).filter((n) => Number.isFinite(n) && n > 0);
    const inStock = variants.some((v) => (v.stock ?? v.quantity ?? 0) > 0);
    const images = (product.images || []).map((i) => getImageUrl(i.url)).filter(Boolean);
    const url = absoluteUrl(`/products/${product.slug}`);

    const data = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: plain(product.description || product.shortDescription).slice(0, 5000) || product.name,
        image: images,
        sku: variants[0]?.sku || product.id,
        brand: { "@type": "Brand", name: "MWP SUPPLEMENTS" },
        url,
    };
    if (prices.length) {
        data.offers = {
            "@type": prices.length > 1 && Math.min(...prices) !== Math.max(...prices) ? "AggregateOffer" : "Offer",
            priceCurrency: "USD",
            ...(prices.length > 1 && Math.min(...prices) !== Math.max(...prices)
                ? { lowPrice: Math.min(...prices).toFixed(2), highPrice: Math.max(...prices).toFixed(2), offerCount: prices.length }
                : { price: Math.min(...prices).toFixed(2) }),
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
            itemCondition: "https://schema.org/NewCondition",
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
            },
            hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "US",
                returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                merchantReturnLink: absoluteUrl("/return-policy"),
            },
        };
    }
    // Only verified-buyer reviews are collected, so the rating shown here is verified-purchase data
    const count = Number(product.reviewCount || 0);
    const avg = Number(product.avgRating || 0);
    if (count > 0 && avg > 0) {
        data.aggregateRating = { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: count, bestRating: 5, worstRating: 1 };
    }
    const reviews = (product.reviews || []).filter((r) => r.rating).slice(0, 5);
    if (reviews.length) {
        data.review = reviews.map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { "@type": "Person", name: r.user?.name || "Verified customer" },
            ...(r.title ? { name: r.title } : {}),
            ...(r.comment ? { reviewBody: r.comment } : {}),
            datePublished: r.createdAt,
        }));
    }
    return data;
}

function breadcrumbJsonLd(product) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Products", item: absoluteUrl("/products") },
            { "@type": "ListItem", position: 3, name: product.name, item: absoluteUrl(`/products/${product.slug}`) },
        ],
    };
}

export default async function ProductDetailPage({ params }) {
    const product = await getProduct(params.slug);
    if (!product) notFound();

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(product)).replace(/</g, "\\u003c") }} />
            <ProductContent slug={params.slug} initialProduct={product} />
        </>
    );
}
