export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect /dashboard and all sub-routes only
    "/dashboard/:path*",
  ],
};
