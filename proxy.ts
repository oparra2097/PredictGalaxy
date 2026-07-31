import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Requests now come from the OdysseySky mobile app (a different origin,
 * potentially a plain HTTP dev IP) as well as the web app's own pages, so
 * the API needs explicit CORS headers. Wildcard origin is fine here since
 * these endpoints are public and don't use cookies/auth — revisit if that
 * changes.
 */
export function proxy(request: NextRequest) {
  const response =
    request.method === "OPTIONS" ? new NextResponse(null, { status: 204 }) : NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
