import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import logger from "@/backend/lib/logger";
import { relations } from "./drizzleRelations";

export type DatabaseProvider = "postgres" | "neon";

const createNeonDb = () => {
	logger.log("Initializing Neon serverless connection");
	const sql = neon(process.env.DATABASE_URL);
	const db = drizzleNeon({ client: sql, relations });
	return db;
};

export type NeonDbType = ReturnType<typeof createNeonDb>;

const createPostgresDb = () => {
	logger.log("Initializing PostgreSQL connection pool");
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10,
	});
	const db = drizzlePostgres({ client: pool, relations });
	return db;
};

export type PostgresDbType = ReturnType<typeof createPostgresDb>;

export function createDatabase(): NeonDbType | PostgresDbType {
	const provider = process.env.DB_PROVIDER || "postgres";

	if (!process.env.DATABASE_URL) {
		logger.error("DATABASE_URL is not set in environment variables");
		process.exit(1);
	}

	logger.log(`Creating database connection with provider: ${provider}`);

	if (provider === "neon") {
		return createNeonDb();
	}
	return createPostgresDb();
}

export function createPool() {
	const provider = process.env.DB_PROVIDER || "postgres";

	if (provider === "neon") {
		throw new Error("Pool creation not supported for Neon provider");
	}

	return new Pool({
		connectionString: process.env.DATABASE_URL,
		max: 10,
	});
}
