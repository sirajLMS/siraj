import logger from "@/backend/lib/logger";

/**
 * Environment variable validation
 * Ensures critical environment variables are properly configured
 */

export interface EnvironmentConfig {
  nodeEnv: string;
  jwtSecret: string;
  databaseUrl: string;
  cacheProvider: "redis" | "postgres";
  redisProvider: "local" | "upstash";
  redisUrl: string;
  upstashRedisUrl?: string;
  upstashRedisToken?: string;
  allowedOrigin: string | undefined;
}

/**
 * Generic helper to get an environment variable with validation
 */
function getEnumEnv<T extends string>(name: string, allowed: T[], defaultValue: T): T {
  const value = (process.env[name])?.toLowerCase() as T | undefined;
  if (!value) return defaultValue;

  if (!allowed.includes(value)) {
    logger.warn(`⚠️  Invalid ${name}: ${value}. Must be one of: ${allowed.join(", ")}. Using '${defaultValue}'.`);
    return defaultValue;
  }
  return value;
}

/**
 * Validate JWT_SECRET
 */
function validateJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: JWT_SECRET is not set in production environment.");
    }
    logger.warn("⚠️  JWT_SECRET not set. Using default for development.");
    return "development-secret-change-me-in-production";
  }

  if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error(`CRITICAL: JWT_SECRET must be at least 32 characters in production. Length: ${jwtSecret.length}`);
  }

  return jwtSecret;
}

/**
 * Validate DATABASE_URL
 */
function validateDatabaseUrl(): string {
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

  return databaseUrl;
}

/**
 * Validate Redis configuration based on provider
 */
function validateRedisConfig(): {
  redisProvider: "local" | "upstash";
  redisUrl: string;
  upstashRedisUrl?: string;
  upstashRedisToken?: string;
} {
  const provider = getEnumEnv("REDIS_PROVIDER", ["local", "upstash"], "local");

  if (provider === "local") {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    logger.log(`Redis provider: local (${redisUrl})`);
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
      redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    };
  }

  logger.log("Redis provider: upstash (serverless)");
  return {
    redisProvider: "upstash",
    redisUrl: "",
    upstashRedisUrl,
    upstashRedisToken,
  };
}

function logEnvironmentConfig(config: EnvironmentConfig): void {
  if (config.nodeEnv !== "development") return;

  logger.log("Configuration:");
  logger.log(`  NODE_ENV: ${config.nodeEnv}`);
  logger.log(`  JWT_SECRET: ${config.jwtSecret ? "[SET]" : "[NOT SET]"}`);
  logger.log(`  DATABASE_URL: ${config.databaseUrl ? "[SET]" : "[NOT SET]"}`);
  logger.log(`  CACHE_PROVIDER: ${config.cacheProvider}`);
  logger.log(`  REDIS_PROVIDER: ${config.redisProvider}`);

  if (config.redisProvider === "local") {
    logger.log(`  REDIS_URL: ${config.redisUrl}`);
  } else {
    logger.log(`  UPSTASH_REDIS_REST_URL: ${config.upstashRedisUrl ? "[SET]" : "[NOT SET]"}`);
    logger.log(`  UPSTASH_REDIS_REST_TOKEN: ${config.upstashRedisToken ? "[SET]" : "[NOT SET]"}`);
  }
  logger.log(`  ALLOWED_ORIGIN: ${config.allowedOrigin || "[DEFAULT]"}`);
}

/**
 * Main validation function
 */
export function validateEnvironment(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV as string) || "development";

  logger.log("🔍 Validating environment variables...");
  logger.log(`Environment: ${nodeEnv}`);

  try {
    const cacheProvider = getEnumEnv("CACHE_PROVIDER", ["redis", "postgres"], "redis");
    const redisConfig =
      cacheProvider === "redis"
        ? validateRedisConfig()
        : {
            redisProvider: "local" as const,
            redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
          };

    const config: EnvironmentConfig = {
      nodeEnv,
      jwtSecret: validateJwtSecret(),
      databaseUrl: validateDatabaseUrl(),
      cacheProvider,
      ...redisConfig,
      allowedOrigin: process.env.ALLOWED_ORIGIN,
    };

    if (process.env.NODE_ENV === "production" && !config.allowedOrigin) {
      logger.warn("⚠️  ALLOWED_ORIGIN not set in production.");
    }

    logger.log("✅ Environment validation successful!");
    logEnvironmentConfig(config);

    return config;
  } catch (error) {
    logger.error("❌ Environment validation failed!");
    logger.error(error instanceof Error ? error.message : String(error));

    if (process.env.NODE_ENV === "production") {
      logger.error("Exiting due to invalid environment configuration.");
      process.exit(1);
    }

    throw error;
  }
}

/**
 * Optional: Validate specific environment variables at runtime
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Optional: Get environment variable with default
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// Auto-validate on module import
validateEnvironment();
