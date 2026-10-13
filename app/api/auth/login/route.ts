import { NextResponse } from "next/server";
import { clientIp, parseJson, publicRoute } from "@/lib/server/http";
import { login } from "@/lib/server/services/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/auth/session";
import { loginSchema } from "@/lib/shared/schemas";

export const POST = publicRoute(async (req) => {
  const input = await parseJson(req, loginSchema);
  const { user, token, expiresAt } = await login(input, clientIp(req));
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
