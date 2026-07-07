import { isServerlessRuntime, isTestEnv, isVercelRuntime } from "@/backend/lib/runtime";

export type DbConnectionStrategy = "pg-pooled" | "neon-serverless";
export type DbConnectionMode = "auto" | "pg" | "neon";

export type PoolMaxContext = {
  isTest: boolean;
  isVercel: boolean;
  isServerless: boolean;
};

function getConnectionMode(): DbConnectionMode {
  const mode = process.env.DB_CONNECTION_MODE?.toLowerCase();
  if (mode === "pg" || mode === "neon") return mode;
  return "auto";
}

export function resolveConnectionStrategy(): DbConnectionStrategy {
  const mode = getConnectionMode();

  if (mode === "pg") return "pg-pooled";
  if (mode === "neon") return "neon-serverless";

  if (isVercelRuntime() || isServerlessRuntime()) {
    return "pg-pooled";
  }

  const provider = process.env.DB_PROVIDER || "postgres";
  return provider === "neon" ? "neon-serverless" : "pg-pooled";
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
