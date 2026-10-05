/** @type {import('next').NextConfig} */
const nextConfig = {
    ...(process.env.MWP_BUILD_DIST_DIR ? { distDir: process.env.MWP_BUILD_DIST_DIR } : {}),
    images: {
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
    experimental: {
        webpackBuildWorker: false,
    }
};

export default nextConfig;
