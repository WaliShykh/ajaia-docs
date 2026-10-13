import { NextResponse } from "next/server";
import { clientIp, parseJson, publicRoute } from "@/server/http";
import { login } from "@/server/services/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/auth/session";
import { loginSchema } from "@/shared/schemas";

export const POST = publicRoute(async (req) => {
  const input = await parseJson(req, loginSchema);
  const { user, token, expiresAt } = await login(input, clientIp(req));
  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
