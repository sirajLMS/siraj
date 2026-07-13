import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./backend/drizzle",
  dialect: "postgresql", // 'mysql' | 'sqlite'
  schema: "./backend/db/schema/index.ts",
  schemaFilter: ["public"], // limit push to just the public schema (don't touch neon_auth, etc.)
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
