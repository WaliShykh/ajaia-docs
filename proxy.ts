import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/shared/session-cookie";
import { routePaths } from "@/client/config/routePaths";

/**
 * Runs before every page render:
 *  1. Per-request nonce-based Content Security Policy (strict-dynamic).
 *  2. Optimistic auth redirect (cookie presence only). The real session check
 *     happens against the database in the page/route — this just avoids
 *     rendering protected shells for signed-out visitors.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isPublic = pathname === routePaths.login || pathname === routePaths.signup;
  if (!hasSession && !isPublic) {
    const url = new URL(routePaths.login, request.url);
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  // style-src allows inline style *attributes*: React Aria positions popovers and
  // Tiptap/ProseMirror set styles inline. Inline styles can't execute code; scripts
  // stay locked to nonces.
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
