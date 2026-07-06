import fs from "node:fs/promises";
import { getLocalStorageBasePath } from "@/backend/lib/storage/local-storage-path";
import type { StorageService } from "../storage.service.interface";
import { LocalAdapter } from "./adapter";

const SERVERLESS_ENV_VARS = [
  "VERCEL",
  "NETLIFY",
  "AWS_LAMBDA_FUNCTION_NAME",
  "K_SERVICE",
  "FUNCTION_TARGET",
  "FUNCTIONS_WORKER_RUNTIME",
  "CF_PAGES",
  "RAILWAY_ENVIRONMENT",
];

/**
 * Checks if the current environment is a known serverless platform
 */
function getDetectedServerlessEnv(): string[] {
  return SERVERLESS_ENV_VARS.filter(envVar => !!process.env[envVar]);
}

/**
 * Validates that local storage is not used in serverless environments
 */
function ensureNotServerless(): void {
  const detected = getDetectedServerlessEnv();

  if (detected.length > 0) {
    throw new Error(
      "FATAL: The 'local' storage provider is enabled in a serverless environment. " +
        "This is not supported and will lead to data loss. " +
        "Use a compatible cloud provider (e.g., 'gcp', 's3') in your environment configuration. " +
        `Detected environment: ${detected.join(", ")}`
    );
  }
}

/**
 * Factory function for LocalAdapter
 */
export async function createLocalAdapter(): Promise<StorageService> {
  ensureNotServerless();

  const fullPath = getLocalStorageBasePath();

  await fs.mkdir(fullPath, { recursive: true, mode: 0o755 });

  return new LocalAdapter();
}
