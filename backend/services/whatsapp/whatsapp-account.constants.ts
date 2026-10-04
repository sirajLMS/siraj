/** Placeholder string for credentials not yet set via dedicated mutations. */
export const SYNC_STATUS_PENDING = "pending" as const;

/**
 * Env keys the env-bootstrap path for `syncFromMeta` depends on. These are
 * `.env`-only (never DB-seeded); the resolver is read-only and never persists
 * values to `system_settings`.
 */
export const WHATSAPP_ENV_BOOTSTRAP_KEYS = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_WABA_ID"] as const;

/** RFC 4122 UUID format matcher (case-insensitive). */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Meta numeric IDs (wabaId / phoneNumberId) are digit strings, ≤64 chars. */
export const META_NUMERIC_ID_REGEX = /^\d{1,64}$/;

/** Meta App Dashboard root — per-app panels hang off `/<appId>/…`. */
export const META_APP_DASHBOARD_BASE_URL = "https://developers.facebook.com/apps";

/**
 * Max concurrent phone-number writes when no explicit transaction is supplied
 * (r10-032). Bounds the number of independent DB connections pulled from the
 * pool so we never saturate it with one unbounded `Promise.all`.
 */
export const MAX_CONCURRENT_PHONES = 5;
