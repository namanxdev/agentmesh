import { auth } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Local development uses a fixed BFF identity in the API proxy. Keep the
  // route open here so UI work and browser QA do not require Google OAuth.
  // `next dev` always sets NODE_ENV to development; production stays protected.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const session = await auth();

  // Redirect unauthenticated users to /login
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect /dashboard and all sub-routes only
    "/dashboard/:path*",
  ],
};
