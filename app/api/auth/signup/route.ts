import { NextResponse } from "next/server";
import { clientIp, parseJson, publicRoute } from "@/server/http";
import { signup } from "@/server/services/auth";
import { SESSION_COOKIE, sessionCookieOptions } from "@/server/auth/session";
import { signupSchema } from "@/shared/schemas";

export const POST = publicRoute(async (req) => {
  const input = await parseJson(req, signupSchema);
  const { user, token, expiresAt } = await signup(input, clientIp(req));
  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  return res;
});
