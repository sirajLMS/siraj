/** Env var key for the consolidated Users directory feature flag. */
export const USERS_DIRECTORY_ENV_KEY = "NEXT_PUBLIC_ENABLE_USERS_DIRECTORY" as const;

/** Parses env-config boolean values (trimmed, case-insensitive `"true"`). */
export function parseEnvConfigBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}
