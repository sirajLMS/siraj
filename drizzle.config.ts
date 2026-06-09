import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./backend/drizzle",
  dialect: "postgresql", // 'mysql' | 'sqlite'
  schema: "./backend/db/schema/index.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
