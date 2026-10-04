import {
  getEnumEnv,
  validateDatabaseUrl,
  validateJwtSecret,
  validateNodeEnv,
  validateNoPlaceholderSecrets,
  validateRedisConfig,
  validateRequiredAppSecret,
} from "@/backend/lib/env.validators";
import { clearGlobalSingleton, getGlobalSingleton } from "@/backend/lib/global-singleton";
import { logger } from "@/backend/lib/logger";
import { sanitizeUrlCredentials } from "@/backend/lib/utils/url";

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
  // App-wide secrets (validated server-side only)
  databaseEncryptionKey: string;
  adminEmail: string;
  adminPassword: string;
  storageProvider: string;
  // Optional feature-gated config (surfaced verbatim from process.env)
  gcpProjectId?: string;
  gcpSecretId?: string;
  gcpSecretVersion?: string;
  gcpCredentialsJson?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  firebaseProjectId?: string;
  firebasePrivateKey?: string;
  firebaseClientEmail?: string;
  blobReadWriteToken?: string;
  smsProvider?: string;
  emailProvider?: string;
  pushProvider?: string;
  fxProvider?: string;
  openexchangeratesAppId?: string;
  fixerApiKey?: string;
  cronSecret?: string;
  signedUrlCleanupStrategy?: string;
  localStoragePath?: string;
  nextPublicBaseUrl?: string;
  disableRateLimiting?: boolean;
  isDemo?: boolean;
  nextPublicIsDemo?: boolean;
  dbConnectionMode?: string;
  dbProvider?: string;
  cleanupEnabled?: boolean;
  devOrigin?: string;
  // Meeting integrations (optional — surfaced from process.env)
  zoomAccountId?: string;
  zoomClientId?: string;
  zoomClientSecret?: string;
  zoomRequiredScopes?: string;
  googleMeetServiceAccountJson?: string;
  googleMeetImpersonateSubject?: string;
  googleMeetClientId?: string;
  googleMeetClientSecret?: string;
  msTeamsTenantId?: string;
  msTeamsClientId?: string;
  msTeamsClientSecret?: string;
  msTeamsOrganizerUserId?: string;
  msTeamsRequiredScopes?: string;
  oauthRedirectBaseUrl?: string;
}

/**
 * Read an env var as a string, returning the fallback if unset.
 */
export function getStringEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

/**
 * Read an env var as a boolean — true only when value (case-insensitive) === "true".
 * Suitable for DISABLE_RATE_LIMITING, IS_DEMO, CLEANUP_ENABLED, etc.
 */
export function getBooleanEnv(name: string): boolean {
  return process.env[name]?.toLowerCase() === "true";
}

function logEnvironmentConfig(config: EnvironmentConfig): void {
  if (config.nodeEnv !== "development") return;

  logger.debug("Configuration:");
  logger.debug(`  NODE_ENV: ${config.nodeEnv}`);
  logger.debug(`  JWT_SECRET: ${config.jwtSecret ? "[SET]" : "[NOT SET]"}`);
  logger.debug(`  DATABASE_URL: ${config.databaseUrl ? "[SET]" : "[NOT SET]"}`);
  logger.debug(`  CACHE_PROVIDER: ${config.cacheProvider}`);
  logger.debug(`  REDIS_PROVIDER: ${config.redisProvider}`);

  if (config.redisProvider === "local") {
    logger.debug(`  REDIS_URL: ${sanitizeUrlCredentials(config.redisUrl)}`);
  } else {
    logger.debug(`  UPSTASH_REDIS_REST_URL: ${config.upstashRedisUrl ? "[SET]" : "[NOT SET]"}`);
    logger.debug(`  UPSTASH_REDIS_REST_TOKEN: ${config.upstashRedisToken ? "[SET]" : "[NOT SET]"}`);
  }
  logger.debug(`  ALLOWED_ORIGIN: ${config.allowedOrigin ?? "[DEFAULT]"}`);
}

/**
 * Build the EnvironmentConfig object from validated env vars and process.env passthroughs.
 */
function buildEnvironmentConfig(
  nodeEnv: string,
  cacheProvider: "redis" | "postgres",
  redisConfig: {
    redisProvider: "local" | "upstash";
    redisUrl: string;
    upstashRedisUrl?: string;
    upstashRedisToken?: string;
  }
): EnvironmentConfig {
  return {
    nodeEnv,
    jwtSecret: validateJwtSecret(),
    databaseUrl: validateDatabaseUrl(),
    cacheProvider,
    ...redisConfig,
    allowedOrigin: process.env.ALLOWED_ORIGIN,
    databaseEncryptionKey: validateRequiredAppSecret("DATABASE_ENCRYPTION_KEY"),
    adminEmail: validateRequiredAppSecret("ADMIN_EMAIL"),
    adminPassword: validateRequiredAppSecret("ADMIN_PASSWORD"),
    storageProvider: validateRequiredAppSecret("STORAGE_PROVIDER"),
    gcpProjectId: process.env.GCP_PROJECT_ID,
    gcpSecretId: process.env.GCP_SECRET_ID,
    gcpSecretVersion: process.env.GCP_SECRET_VERSION,
    gcpCredentialsJson: process.env.GCP_CREDENTIALS_JSON,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
    smsProvider: process.env.SMS_PROVIDER,
    emailProvider: process.env.EMAIL_PROVIDER,
    pushProvider: process.env.PUSH_PROVIDER,
    fxProvider: process.env.FX_PROVIDER,
    openexchangeratesAppId: process.env.OPENEXCHANGERATES_APP_ID,
    fixerApiKey: process.env.FIXER_API_KEY,
    cronSecret:
      process.env.NODE_ENV === "production"
        ? validateRequiredAppSecret("CRON_SECRET")
        : (process.env.CRON_SECRET ?? ""),
    signedUrlCleanupStrategy: process.env.SIGNED_URL_CLEANUP_STRATEGY,
    localStoragePath: process.env.LOCAL_STORAGE_PATH,
    nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    disableRateLimiting: getBooleanEnv("DISABLE_RATE_LIMITING"),
    isDemo: getBooleanEnv("IS_DEMO"),
    nextPublicIsDemo: getBooleanEnv("NEXT_PUBLIC_IS_DEMO"),
    dbConnectionMode: process.env.DB_CONNECTION_MODE,
    dbProvider: process.env.DB_PROVIDER,
    cleanupEnabled: getBooleanEnv("CLEANUP_ENABLED"),
    devOrigin: process.env.DEV_ORIGIN,
    zoomAccountId: process.env.ZOOM_ACCOUNT_ID,
    zoomClientId: process.env.ZOOM_CLIENT_ID,
    zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
    zoomRequiredScopes: process.env.ZOOM_REQUIRED_SCOPES,
    googleMeetServiceAccountJson: process.env.GOOGLE_MEET_SERVICE_ACCOUNT_JSON,
    googleMeetImpersonateSubject: process.env.GOOGLE_MEET_IMPERSONATE_SUBJECT,
    googleMeetClientId: process.env.GOOGLE_MEET_CLIENT_ID,
    googleMeetClientSecret: process.env.GOOGLE_MEET_CLIENT_SECRET,
    msTeamsTenantId: process.env.MS_TEAMS_TENANT_ID,
    msTeamsClientId: process.env.MS_TEAMS_CLIENT_ID,
    msTeamsClientSecret: process.env.MS_TEAMS_CLIENT_SECRET,
    msTeamsOrganizerUserId: process.env.MS_TEAMS_ORGANIZER_USER_ID,
    msTeamsRequiredScopes: process.env.MS_TEAMS_REQUIRED_SCOPES,
    oauthRedirectBaseUrl: process.env.OAUTH_REDIRECT_BASE_URL,
  };
}

/**
 * Main validation function
 */
export function validateEnvironment(): EnvironmentConfig {
  const nodeEnv = validateNodeEnv();

  logger.debug("🔍 Validating environment variables...");
  logger.debug(`Environment: ${nodeEnv}`);

  try {
    const cacheProvider = getEnumEnv("CACHE_PROVIDER", ["redis", "postgres"], "redis");
    const redisConfig =
      cacheProvider === "redis"
        ? validateRedisConfig()
        : {
            redisProvider: "local" as const,
            redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
          };

    validateNoPlaceholderSecrets();

    const config = buildEnvironmentConfig(nodeEnv, cacheProvider, redisConfig);

    if (process.env.NODE_ENV === "production" && !config.allowedOrigin) {
      logger.warn("⚠️  ALLOWED_ORIGIN not set in production.");
    }

    logger.debug("✅ Environment validation successful!");
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
  return process.env[name] ?? defaultValue;
}

const ENV_KEY = Symbol.for("siraj.env");

let cachedConfig: EnvironmentConfig | undefined;

function warnIfVercelDatabaseUrlNotPooled(databaseUrl: string): void {
  if (!process.env.VERCEL || !databaseUrl) return;
  if (process.env.DB_PROVIDER?.toLowerCase() !== "neon") return;

  const isPooled = databaseUrl.includes("-pooler.") || databaseUrl.includes("pooler=true");
  if (!isPooled) {
    logger.warn("⚠️  On Vercel, use a Neon pooled connection string (-pooler host) with Fluid compute TCP pooling.");
  }
}

/**
 * Clears the in-memory cached environment configuration singleton.
 *
 * This forces the next call to `getEnvironmentConfig()` or `ensureEnvironmentValidated()`
 * to re-parse and re-validate process.env (for example when switching `.env` files via CLI).
 */
export function resetEnvironmentCache(): void {
  clearGlobalSingleton(ENV_KEY);
  cachedConfig = undefined;
}

/**
 * Validate environment once per process (survives Turbopack module re-evaluation).
 */
export function ensureEnvironmentValidated(): EnvironmentConfig {
  return getGlobalSingleton(ENV_KEY, () => {
    cachedConfig = validateEnvironment();
    warnIfVercelDatabaseUrlNotPooled(cachedConfig.databaseUrl);
    return cachedConfig;
  });
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return cachedConfig ?? ensureEnvironmentValidated();
}
