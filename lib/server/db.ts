import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/**
 * One database handle per server instance.
 *
 * - DATABASE_URL set   → Postgres (Neon pooled URL in production). Migrations run at build time.
 * - DATABASE_URL unset → embedded PGlite in ./.data (or in-memory for tests), migrated and
 *                        seeded on first use so `npm run dev` needs zero setup.
 *
 * The handle is cached on globalThis so dev hot-reloads don't open new pools.
 */
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    // prepare:false is required behind PgBouncer-style transaction poolers (Neon pooled URLs).
    const client = postgres(url, { max: 5, prepare: false, idle_timeout: 20 });
    return drizzle(client, { schema }) as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir =
    process.env.PGLITE_DIR === "memory" ? undefined : (process.env.PGLITE_DIR ?? ".data/pglite");
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const db = drizzle(new PGlite(dataDir), { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  if (process.env.PGLITE_SEED !== "false") {
    const { seed } = await import("./seed");
    await seed(db as unknown as Db);
  }
  return db as unknown as Db;
}

const globalForDb = globalThis as unknown as { __db?: Promise<Db> };

export function getDb(): Promise<Db> {
  globalForDb.__db ??= connect().catch((err) => {
    globalForDb.__db = undefined; // allow retry on transient connection failures
    throw err;
  });
  return globalForDb.__db;
}

export { schema };
