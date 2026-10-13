import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` throws outside the React Server bundle; tests exercise server code directly.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Each test file gets a fresh in-memory Postgres (PGlite), migrated and seeded.
    env: { PGLITE_DIR: "memory", DATABASE_URL: "" },
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
