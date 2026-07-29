/** Env var key for the consolidated People directory feature flag. */
export const PEOPLE_DIRECTORY_ENV_KEY = "NEXT_PUBLIC_ENABLE_PEOPLE_DIRECTORY" as const;

/** Parses env-config boolean values (trimmed, case-insensitive `"true"`). */
export function parseEnvConfigBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}
