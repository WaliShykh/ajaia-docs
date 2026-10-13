import { NextResponse } from "next/server";
import { publicRoute } from "@/server/http";
import { SESSION_COOKIE, deleteSession, sessionCookieOptions } from "@/server/auth/session";

export const POST = publicRoute(async (req) => {
  await deleteSession(req.cookies.get(SESSION_COOKIE)?.value); // server-side revocation
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(new Date(0)));
  return res;
});
