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
 * Validate JWT_SECRET
 * In production, must be at least 32 characters for security
 */
function validateJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: JWT_SECRET is not set in production environment. " + "This is required for secure authentication."
      );
    } else {
      // Use a default in development (not recommended for production)
      logger.warn("⚠️  JWT_SECRET not set. Using default for development. " + "DO NOT use this in production!");
      return "development-secret-change-me-in-production";
    }
  }

  if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
    throw new Error(
      "CRITICAL: JWT_SECRET must be at least 32 characters in production. " + `Current length: ${jwtSecret.length}`
    );
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
    } else {
      logger.warn("⚠️  DATABASE_URL not set. Database operations may fail.");
      return "";
    }
  }

  // Basic validation for PostgreSQL URL format
  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    logger.warn("⚠️  DATABASE_URL may not be a valid PostgreSQL connection string.");
  }

  return databaseUrl;
}

/**
 * Validate CACHE_PROVIDER
 */
function validateCacheProvider(): "redis" | "postgres" {
  const rawProvider = process.env.CACHE_PROVIDER as string | undefined;
  const provider = rawProvider?.toLowerCase();

  if (!provider) {
    // Default to redis for development
    return "redis";
  }

  if (provider !== "redis" && provider !== "postgres") {
    logger.warn(`⚠️  Invalid CACHE_PROVIDER: ${provider}. Must be 'redis' or 'postgres'. Using 'redis'.`);
    return "redis";
  }

  return provider;
}

/**
 * Validate REDIS_PROVIDER
 */
function validateRedisProvider(): "local" | "upstash" {
  const rawProvider = process.env.REDIS_PROVIDER as string | undefined;
  const provider = rawProvider?.toLowerCase();

  if (!provider) {
    // Default to local for development
    return "local";
  }

  if (provider !== "local" && provider !== "upstash") {
    logger.warn(`⚠️  Invalid REDIS_PROVIDER: ${provider}. Must be 'local' or 'upstash'. Using 'local'.`);
    return "local";
  }

  return provider;
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
  const provider = validateRedisProvider();

  if (provider === "local") {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    logger.log(`Redis provider: local (${redisUrl})`);
    return { redisProvider: provider, redisUrl };
  }

  // Upstash provider
  const upstashRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashRedisUrl || !upstashRedisToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL: Upstash Redis provider requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN. " +
          "Get these from https://console.upstash.com/"
      );
    } else {
      logger.warn("⚠️  Upstash Redis selected but credentials missing. Falling back to local Redis.");
      return {
        redisProvider: "local",
        redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      };
    }
  }

  logger.log("Redis provider: upstash (serverless)");
  return {
    redisProvider: "upstash",
    redisUrl: "",
    upstashRedisUrl,
    upstashRedisToken,
  };
}

/**
 * Validate ALLOWED_ORIGIN for CORS
 */
function validateAllowedOrigin(): string | undefined {
  const allowedOrigin = process.env.ALLOWED_ORIGIN;

  if (process.env.NODE_ENV === "production" && !allowedOrigin) {
    logger.warn("⚠️  ALLOWED_ORIGIN not set in production. " + "CORS will use default. Set this for security.");
  }

  return allowedOrigin;
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
 * Call this early in application startup
 */
export function validateEnvironment(): EnvironmentConfig {
  const rawNodeEnv = process.env.NODE_ENV as string | undefined;
  const nodeEnv = rawNodeEnv || "development";

  logger.log("🔍 Validating environment variables...");
  logger.log(`Environment: ${nodeEnv}`);

  try {
    const cacheProvider = validateCacheProvider();
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
      allowedOrigin: validateAllowedOrigin(),
    };

    logger.log("✅ Environment validation successful!");

    // Log configuration (without sensitive data)
    logEnvironmentConfig(config);

    return config;
  } catch (error) {
    logger.error("❌ Environment validation failed!");
    logger.error(error instanceof Error ? error.message : String(error));

    // Exit in production to prevent insecure startup
    if (nodeEnv === "production") {
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

// Auto-validate on module import (runs once at startup)
// Comment this out if you want manual validation
// Only run on server-side
validateEnvironment();
