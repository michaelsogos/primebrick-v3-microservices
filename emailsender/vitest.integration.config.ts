import { defineConfig } from "vitest/config";

/**
 * Layer 2 — integration tests (real PostgreSQL via getDal gateway).
 * Requires DATABASE_URL in .env. Real DB calls, real fake Brevo HTTP server.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/integration/**/*.test.ts"],
    globals: false,
    // Integration tests share a single PostgreSQL database. Running test files
    // in parallel causes race conditions on DDL (CREATE TABLE IF NOT EXISTS)
    // and TRUNCATE. Serialize file execution.
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
