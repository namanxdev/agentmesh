import { auth } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
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
