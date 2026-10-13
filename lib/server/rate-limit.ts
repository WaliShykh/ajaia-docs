import "server-only";
import { lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { rateLimits } from "./schema";
import { RateLimited } from "./errors";

/**
 * Fixed-window rate limit backed by Postgres (atomic upsert), so it holds
 * across any number of stateless app instances.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const db = await getDb();
  const nowMs = Date.now();
  const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  // Occasionally prune old windows; cheap and keeps the table small.
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(nowMs - 24 * 3600_000)));
  }

  if (row.count > limit) {
    const retryAfter = Math.ceil((windowStart.getTime() + windowMs - nowMs) / 1000);
    throw new RateLimited(retryAfter);
  }
}
