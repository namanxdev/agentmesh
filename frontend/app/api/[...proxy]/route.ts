import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ proxy: string[] }> }
): Promise<NextResponse> {
  const session = await auth();

  // Reconstruct FastAPI URL: /api/[proxy...] → FASTAPI_URL/api/...
  const { proxy: segments } = await params;
  const path = segments.join("/");
  const targetUrl = new URL(`${FASTAPI_URL}/api/${path}`);

  // Forward query string
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Build forwarded headers
  const forwardHeaders = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) forwardHeaders.set("content-type", contentType);
  forwardHeaders.set("accept", request.headers.get("accept") ?? "application/json");

  // Add BFF identity headers (trusted because this runs server-side)
  if (session?.user) {
    forwardHeaders.set("x-user-id", session.user.id ?? "");
    forwardHeaders.set("x-user-email", session.user.email ?? "");
    forwardHeaders.set("x-user-name", session.user.name ?? "");
    if (session.user.image) forwardHeaders.set("x-user-image", session.user.image);
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const body = await request.text();
    if (body) fetchOptions.body = body;
  }

  try {
    const response = await fetch(targetUrl.toString(), fetchOptions);
    const responseText = await response.text();

    const responseHeaders = new Headers();
    const ct = response.headers.get("content-type");
    if (ct) responseHeaders.set("content-type", ct);

    return new NextResponse(responseText, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[proxy] FastAPI unreachable:", err);
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 503 }
    );
  }
}

export {
  proxyRequest as GET,
  proxyRequest as POST,
  proxyRequest as PUT,
  proxyRequest as DELETE,
  proxyRequest as PATCH,
};
