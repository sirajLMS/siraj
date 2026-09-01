const SERVERLESS_ENV_VARS = [
  "VERCEL",
  "NETLIFY",
  "AWS_LAMBDA_FUNCTION_NAME",
  "K_SERVICE",
  "FUNCTION_TARGET",
  "FUNCTIONS_WORKER_RUNTIME",
  "CF_PAGES",
  "RAILWAY_ENVIRONMENT",
] as const;

export type ServerlessEnvVar = (typeof SERVERLESS_ENV_VARS)[number];

export function getDetectedServerlessEnv(): ServerlessEnvVar[] {
  return SERVERLESS_ENV_VARS.filter(envVar => !!process.env[envVar]);
}

export function isVercelRuntime(): boolean {
  return !!process.env.VERCEL;
}

export function isServerlessRuntime(): boolean {
  return getDetectedServerlessEnv().length > 0;
}

export function isTestEnv(): boolean {
  return !!process.env.BUN_TEST || process.env.NODE_ENV === "test";
}
