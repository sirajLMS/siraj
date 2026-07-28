/**
 * Env-config keys that must never be returned by the Settings env-config API
 * or exposed via GraphQL. Keep in sync with `excludeFromDb: true` entries in
 * `@/backend/lib/env-config-keys`.
 */
export const HIDDEN_ENV_CONFIG_KEYS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ALLOWED_ORIGIN",
  "GRAPHQL_PATH",
  "IS_DEMO",
  "GOOGLE_FONTS_API_KEY",
  "DATABASE_URL",
  "DATABASE_ENCRYPTION_KEY",
  "JWT_SECRET",
  "GRAPHQL_ENCRYPTION_KEY",
] as const;

export type HiddenEnvConfigKey = (typeof HIDDEN_ENV_CONFIG_KEYS)[number];

export function isHiddenEnvConfigKey(key: string): key is HiddenEnvConfigKey {
  return (HIDDEN_ENV_CONFIG_KEYS as readonly string[]).includes(key);
}
