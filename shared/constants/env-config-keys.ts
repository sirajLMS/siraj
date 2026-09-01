/**
 * Env-config keys that must never be returned by the Settings env-config API
 * or exposed via GraphQL. Keep in sync with `excludeFromDb: true` entries in
 * `@/backend/lib/env-config-keys`.
 */
export const HIDDEN_ENV_CONFIG_KEYS = [
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ALLOWED_ORIGIN",
  "CRON_SECRET",
  "GRAPHQL_PATH",
  "IS_DEMO",
  "GOOGLE_FONTS_API_KEY",
  "DATABASE_URL",
  "DATABASE_ENCRYPTION_KEY",
  "JWT_SECRET",
  "GRAPHQL_ENCRYPTION_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_TEST_TEMPLATE_LANGUAGE",
  "WHATSAPP_TEST_TEMPLATE_NAME",
  "WHATSAPP_TEST_TO_PHONE",
] as const;
