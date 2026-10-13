// Applies SQL migrations to DATABASE_URL, then seeds demo data. Runs during the Vercel build.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../lib/server/schema";
import { seed } from "../lib/server/seed";
import type { Db } from "../lib/server/db";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not set — skipping migrations (local dev uses embedded PGlite).");
  process.exit(0);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: "drizzle" });
await seed(db as unknown as Db);
await client.end();
console.log("Migrations applied and demo data seeded.");
