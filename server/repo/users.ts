import "server-only";
import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { users } from "../schema";

export async function findUserByEmail(db: Db, email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

/** Returns null when the email is already taken (unique constraint), without throwing. */
export async function insertUser(db: Db, values: { email: string; name: string; passwordHash: string }) {
  const [row] = await db.insert(users).values(values).onConflictDoNothing({ target: users.email }).returning();
  return row ?? null;
}
