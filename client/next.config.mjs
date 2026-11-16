/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.MWP_BUILD_DIST_DIR ? { distDir: process.env.MWP_BUILD_DIST_DIR } : {}),
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "desirediv-storage.blr1.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "desirediv-storage.blr1.cdn.digitaloceanspaces.com",
            },
            {
                protocol: "https",
                hostname: "pub-67f953912205445f932ab892164f22e5.r2.dev",
            },
        ]
    },
    poweredByHeader: false,
    compress: true,
    async redirects() {
        return [
            { source: "/terms-of-use", destination: "/terms", permanent: true },
            { source: "/blog", destination: "/university", permanent: true },
            { source: "/blog/:slug", destination: "/university/:slug", permanent: true },
            { source: "/industries", destination: "/", permanent: true },
            { source: "/warranty", destination: "/return-policy", permanent: true },
            { source: "/secret-collection", destination: "/", permanent: true },
            { source: "/secret-collection/:slug", destination: "/", permanent: true },
            { source: "/secret-access", destination: "/", permanent: true },
            { source: "/custom-perfume", destination: "/", permanent: true },
            { source: "/fragrance-finder", destination: "/quiz", permanent: true },
            { source: "/corporate-gifting", destination: "/contact", permanent: true },
            { source: "/contact-us", destination: "/contact", permanent: true },
            { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
            // Canonical host is www. Turn this on (FORCE_WWW=true) only after the proxy's www -> non-www
            // redirect is removed, otherwise the two redirects point at each other.
            ...(process.env.FORCE_WWW === "true"
                ? [{ source: "/:path*", has: [{ type: "host", value: "mwpsupplements.com" }], destination: "https://www.mwpsupplements.com/:path*", permanent: true }]
                : []),
        ];
    },
    async headers() {
        const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
        return [
            ...["/account/:path*", "/auth", "/cart", "/checkout", "/compare", "/profile", "/wishlist", "/forgot-password", "/reset-password/:path*", "/verify-otp", "/resend-verification"].map((source) => ({ source, headers: noindex })),
        ];
    },
    experimental: {
        webpackBuildWorker: false,
    }
};

export default nextConfig;
