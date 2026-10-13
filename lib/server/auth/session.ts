import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "../db";
import { sessions, users } from "../schema";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session-cookie";
import type { UserDTO } from "@/lib/shared/types";

export { SESSION_COOKIE };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const sessionCookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires,
});

/** Creates a session and returns the raw token (only ever sent to the client as a cookie). */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url"); // 256 bits
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash: hashToken(token), userId, expiresAt });
  // Opportunistic cleanup of this user's expired sessions.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
  return { token, expiresAt };
}

export async function validateSessionToken(token: string | undefined): Promise<UserDTO | null> {
  if (!token || token.length > 100) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
