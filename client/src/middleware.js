import { NextResponse } from "next/server";

// Maintenance mode — set NEXT_PUBLIC_MAINTENANCE_MODE=true in .env to show a
// "Coming Soon" page across the whole site instead of the real storefront.
// Bypass it (e.g. for internal preview) with ?preview=<MAINTENANCE_BYPASS_KEY>,
// which is remembered via a cookie for the rest of the session.
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
const BYPASS_KEY = process.env.MAINTENANCE_BYPASS_KEY || "";
const BYPASS_COOKIE = "mwp_maintenance_bypass";
const MAINTENANCE_ALLOWED_PATHS = ["/maintenance"];

// Define private routes that require authentication
const privateRoutes = ["/profile", "/checkout", "/wishlist", "/orders"];

// Define auth routes that should redirect to dashboard if already logged in
const authRoutes = [
    "/auth",
    "/auth",
    "/verify-email",
    "/resend-verification",
    "/forgot-password",
    "/reset-password",
];

export function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;

    if (MAINTENANCE_MODE) {
        const hasBypassCookie = request.cookies.get(BYPASS_COOKIE)?.value === "1";
        const bypassParam = searchParams.get("preview");
        const isBypassing =
            hasBypassCookie || (BYPASS_KEY && bypassParam === BYPASS_KEY);

        const isAllowedPath = MAINTENANCE_ALLOWED_PATHS.some((p) =>
            pathname.startsWith(p)
        );

        if (!isBypassing && !isAllowedPath) {
            const res = NextResponse.rewrite(new URL("/maintenance", request.url));
            res.headers.set("x-robots-tag", "noindex, nofollow");
            res.headers.set("x-maintenance-active", "1");
            return res;
        }

        if (isBypassing && !hasBypassCookie) {
            const res = NextResponse.next();
            res.cookies.set(BYPASS_COOKIE, "1", {
                maxAge: 60 * 60 * 24, // 1 day
                path: "/",
                httpOnly: true,
                sameSite: "lax",
            });
            return res;
        }
    }

    // Get the authentication cookie
    const isAuthenticated =
        request.cookies.has("accessToken") || request.cookies.has("user_session");

    // Check if the path is a private route
    const isPrivateRoute = privateRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if the path is an auth route (login, register, etc.)
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // If accessing a private route without authentication, redirect to login
    if (isPrivateRoute && !isAuthenticated) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    // If accessing an auth route while already authenticated, redirect to account dashboard
    if (isAuthRoute && isAuthenticated && !pathname.includes("verify-email")) {
        return NextResponse.redirect(new URL("/profile", request.url));
    }

    return NextResponse.next();
}

// Configure the paths that middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/ (app's images)
         * - public/ (public files)
         * - api/ (API routes)
         */
        "/((?!_next/static|_next/image|favicon.ico|images|public|api).*)",
    ],
};
