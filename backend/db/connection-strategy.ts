import { getEnvironmentConfig, getStringEnv } from "@/backend/lib/env";
import { isServerlessRuntime, isTestEnv, isVercelRuntime } from "@/backend/lib/runtime";

export type DbConnectionStrategy = "pg-pooled" | "neon-serverless";
export type DbConnectionMode = "auto" | "pg" | "neon";

export type PoolMaxContext = {
  isTest: boolean;
  isVercel: boolean;
  isServerless: boolean;
};

function getConnectionMode(): DbConnectionMode {
  const mode = getStringEnv("DB_CONNECTION_MODE")?.toLowerCase();
  if (mode === "pg" || mode === "neon") return mode;
  return "auto";
}

export function resolveConnectionStrategy(): DbConnectionStrategy {
  const mode = getConnectionMode();

  if (mode === "pg") return "pg-pooled";
  if (mode === "neon") return "neon-serverless";

  // When DB_CONNECTION_MODE is not explicitly set (auto), respect DB_PROVIDER
  // Default DB_PROVIDER to "neon" so neon-serverless is the default strategy
  const provider = getStringEnv("DB_PROVIDER", "neon");
  if (provider === "neon") {
    return "neon-serverless";
  }

  // Only use pg-pooled if DB_PROVIDER is explicitly set to postgres
  return "pg-pooled";
}

export function resolvePoolMax(context: PoolMaxContext): number {
  if (context.isTest) return 3;
  if (context.isVercel) return 1;
  if (context.isServerless) return 2;
  return 10;
}

export function poolMax(): number {
  return resolvePoolMax({
    isTest: isTestEnv(),
    isVercel: isVercelRuntime(),
    isServerless: isServerlessRuntime(),
  });
}

export function poolIdleTimeoutMillis(): number {
  if (isVercelRuntime()) return 5_000;
  if (isServerlessRuntime()) return 10_000;
  return 30_000;
}

export type HttpDbProvider = "neon" | "supabase" | "none";

export function isNeonHttpEligible(): boolean {
  if (process.env.DB_NEON_HTTP_ENABLED === "false") return false;

  const provider = (getStringEnv("DB_PROVIDER") ?? "neon").toLowerCase();
  if (provider !== "neon") return false;

  if (getConnectionMode() === "pg") return false;

  try {
    const databaseUrl = process.env.DATABASE_URL || getEnvironmentConfig().databaseUrl;
    if (!databaseUrl) return false;
    const hostname = new URL(databaseUrl).hostname;
    return /\.neon\.tech$/.test(hostname);
  } catch {
    return false;
  }
}

export function getActiveHttpProvider(): HttpDbProvider {
  if (isNeonHttpEligible()) return "neon";
  return "none";
}
