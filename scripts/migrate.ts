// Applies SQL migrations to DATABASE_URL, then seeds demo data. Runs during the Vercel build.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../server/schema";
import { seed } from "../server/seed";
import type { Db } from "../server/db";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.log("DATABASE_URL not set — skipping migrations (local dev uses embedded PGlite).");
  process.exit(0);
}

async function main(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });
    await seed(db as unknown as Db);
    console.log("Migrations applied and demo data seeded.");
  } finally {
    await client.end();
  }
}

main(url).catch((err) => {
  console.error(err);
  process.exit(1);
});
