import type { db } from "@/backend/db/drizzleDb";

export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
