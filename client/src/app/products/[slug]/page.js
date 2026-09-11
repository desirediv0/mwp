import { fetchApi } from "@/lib/utils";
import ProductContent from "./ProductContent";

const getImageUrl = (image) => {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export async function generateMetadata({ params }) {
    const { slug } = params;
    let title = "Product Details | MWP SUPPLEMENTS";
    let description =
        "High-performance clinical nutrition engineered for Men, Women & Peak Athletic Power. Standardized extracts, zero proprietary blends, third-party verified.";
    let image = null;

    try {
        const response = await fetchApi(`/public/products/${slug}`);
        const product = response.data.product;

        if (product) {
            title = product.metaTitle || `${product.name} | MWP SUPPLEMENTS`;
            description =
                product.metaDescription || product.description || description;

            if (product.images && product.images.length > 0) {
                image = getImageUrl(product.images[0].url);
            }
        }
    } catch (error) {
        console.error("Error fetching product metadata:", error);
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: image ? [image] : [],
            type: "website",
        },
    };
}

export default function ProductDetailPage({ params }) {
    return <ProductContent slug={params.slug} />;
}
