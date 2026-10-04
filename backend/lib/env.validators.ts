import { randomBytes } from "node:crypto";
import { logger } from "@/backend/lib/logger";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";

/**
 * Generic helper to get an environment variable with validation
 */
export function getEnumEnv<T extends string>(name: string, allowed: T[], defaultValue: T): T {
  const raw = process.env[name]?.toLowerCase();
  if (!raw) return defaultValue;

  const match = allowed.find(v => v === raw);
  if (!match) {
    logger.warn(`⚠️  Invalid ${name}: ${raw}. Must be one of: ${allowed.join(", ")}. Using '${defaultValue}'.`);
    return defaultValue;
  }
  return match;
}

/**
 * Validate JWT_SECRET
 */
export function validateJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET is not set in production environment.");
    }
    logger.warn(
      "⚠️  JWT_SECRET not set. Generating a random secret for this session. Set JWT_SECRET in .env for stability."
    );
    return randomBytes(32).toString("hex");
  }

  if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error(`CRITICAL: JWT_SECRET must be at least 32 characters in production. Length: ${jwtSecret.length}`);
  }

  return jwtSecret;
}

/**
 * Validate DATABASE_URL
 */
export function validateDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: DATABASE_URL is not set in production environment.");
    }
    logger.warn("⚠️  DATABASE_URL not set. Database operations may fail.");
    return "";
  }

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    logger.warn("⚠️  DATABASE_URL may not be a valid PostgreSQL connection string.");
  }

  // Validate SSL mode and Neon pooling on Vercel
  validateDatabaseUrlForVercel(databaseUrl);

  return databaseUrl;
}

/**
 * Validate DATABASE_URL for Vercel deployment with Neon
 * - Enforces sslmode=verify-full (or sslmode=require with usews=true)
 * - Warns/errors if not using Neon pooled connection string on Vercel
 */
function validateDatabaseUrlForVercel(databaseUrl: string): void {
  if (!process.env.VERCEL) return;

  try {
    const parsed = new URL(databaseUrl);

    // Check SSL mode
    const sslMode = parsed.searchParams.get("sslmode");
    const useLibpqCompat = parsed.searchParams.get("uselibpqcompat");
    const isRequireWithCompat = sslMode === "require" && useLibpqCompat === "true";

    if (sslMode !== "verify-full" && !isRequireWithCompat) {
      const message =
        "⚠️  On Vercel, DATABASE_URL should use sslmode=verify-full (or sslmode=require with uselibpqcompat=true) for secure connections.";
      if (process.env.NODE_ENV === "production") {
        throw new Error(`CRITICAL: ${message}`);
      }
      logger.warn(message);
    }

    // Check for Neon pooled connection string (only when DB_PROVIDER === "neon")
    if (process.env.DB_PROVIDER?.toLowerCase() === "neon") {
      const isPooled = databaseUrl.includes("-pooler.") || databaseUrl.includes("pooler=true");
      if (!isPooled) {
        const message =
          "⚠️  On Vercel, use a Neon pooled connection string (-pooler host) with Fluid compute TCP pooling.";
        logger.warn(message);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CRITICAL")) {
      throw error;
    }
    logger.warn(
      `⚠️  Could not parse DATABASE_URL for validation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate Redis configuration based on provider
 */
export function validateRedisConfig(): {
  redisProvider: "local" | "upstash";
  redisUrl: string;
  upstashRedisUrl?: string;
  upstashRedisToken?: string;
} {
  const provider = getEnumEnv("REDIS_PROVIDER", ["local", "upstash"], "local");

  if (provider === "local") {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";
    const sanitizedUrl = sanitizeUrlCredentials(redisUrl);
    logger.debug(`Redis provider: local (${sanitizedUrl})`);
    return { redisProvider: provider, redisUrl };
  }

  const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashRedisUrl || !upstashRedisToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: Upstash Redis requires credentials in production.");
    }
    logger.warn("⚠️  Upstash Redis credentials missing. Falling back to local Redis.");
    return {
      redisProvider: "local",
      redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    };
  }

  logger.debug("Redis provider: upstash (serverless)");
  return {
    redisProvider: "upstash",
    redisUrl: "",
    upstashRedisUrl,
    upstashRedisToken,
  };
}

/**
 * Validate NODE_ENV to prevent typos from silently disabling security checks
 */
export function validateNodeEnv(): string {
  const nodeEnv = process.env.NODE_ENV;
  if (!nodeEnv) return "development";

  const validEnvs = ["development", "production", "test", "staging"];
  if (!validEnvs.includes(nodeEnv)) {
    logger.warn(
      `⚠️  Invalid NODE_ENV: "${nodeEnv}". Must be one of: ${validEnvs.join(", ")}. Defaulting to "development".`
    );
    return "development";
  }
  return nodeEnv;
}

/**
 * Validate that secret environment variables don't contain placeholder values
 * (i.e. values with `<` or `>` from .env.example templates that were never replaced)
 */
export function validateNoPlaceholderSecrets(): void {
  const secretEnvVars = [
    "DATABASE_ENCRYPTION_KEY",
    "JWT_SECRET",
    "CRON_SECRET",
    "GRAPHQL_ENCRYPTION_KEY",
    "ADMIN_PASSWORD",
    "RESEND_API_KEY",
    "FIREBASE_PRIVATE_KEY",
    "TWILIO_AUTH_TOKEN",
    "GCP_CREDENTIALS_JSON",
    "BLOB_READ_WRITE_TOKEN",
    "OPENEXCHANGERATES_APP_ID",
    "FIXER_API_KEY",
  ] as const;

  for (const name of secretEnvVars) {
    const value = process.env[name];
    if (!value) continue;

    if (value.includes("<") || value.includes(">")) {
      const message = `CRITICAL: ${name} contains placeholder value. Replace it with a real secret before deploying.`;
      if (process.env.NODE_ENV === "production") {
        throw new Error(message);
      }
      logger.warn(message);
    }
  }
}

/**
 * Validate a required app secret: throws in production, warns + returns "" in non-prod when unset.
 */
export function validateRequiredAppSecret(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`CRITICAL: ${name} is not set in production environment.`);
  }
  logger.warn(`⚠️  ${name} not set. App may not function correctly.`);
  return "";
}
