import "server-only";
import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { users } from "../schema";

export async function findUserByEmail(db: Db, email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}
