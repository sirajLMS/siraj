/**
 * Canonical types for the Settings → Environment Config tab.
 *
 * These types describe the shape of resolved environment configuration
 * entries surfaced by the resolver/UI, along with the input and return
 * types for the GraphQL mutations that create/update/delete DB overrides
 * stored under the `env::<key>` namespace in `system_settings`.
 *
 * The `EnvConfigCategory` and `EnvConfigDisplayStrategy` unions are
 * re-declared locally (rather than imported from
 * `@/backend/lib/env-config-keys`) to keep the types layer free of
 * runtime imports and avoid circular coupling with Stage 3a.
 */

/** Logical grouping for an env-config key. Mirrors `ENV_CONFIG_KEYS`. */
export type EnvConfigCategory =
  | "email"
  | "sms"
  | "push"
  | "fx"
  | "cache"
  | "redis"
  | "storage"
  | "auth"
  | "app"
  | "meeting"
  | "billing"
  | "general";

/** How a resolved value should be presented in the UI. */
export type EnvConfigDisplayStrategy = "plain" | "db_with_mask_only";

/**
 * A single env-config row as returned by the resolver and consumed by
 * the UI. The `value` field carries the resolved value — masked by the
 * caller when `isSecret` is true.
 */
export interface EnvConfigEntry {
  key: string;
  category: EnvConfigCategory;
  displayStrategy: EnvConfigDisplayStrategy;
  description: { en: string; ar: string };
  isSecret: boolean;
  excludeFromDb: boolean;
  /** Resolved value (masked in UI when `isSecret`). */
  value: string | undefined;
  /** Where the resolved value came from. */
  source: "db" | "env" | "unset";
  /** True iff a row exists in `system_settings` under `env::<key>`. */
  hasDbOverride: boolean;
  /** `!excludeFromDb` — whether a DB override may be written. */
  editable: boolean;
}

/** Input for a GraphQL mutation that creates/updates a DB override row. */
export interface EnvConfigUpsertInput {
  /** The env var name, e.g. `"SMTP_HOST"`. */
  key: string;
  /** New value verbatim — masking is UI-only. */
  value: string;
}

/** Return value of the upsert mutation once a DB override is persisted. */
export interface EnvConfigUpsertReturnType {
  key: string;
  source: "db";
  hasDbOverride: true;
  updatedAt: Date;
}

/** Return value of the delete mutation after a DB override is removed. */
export interface EnvConfigDeleteReturnType {
  key: string;
  deleted: boolean;
  source: "env" | "unset";
}

/**
 * Mask a secret value, exposing only the last 4 characters.
 *
 * - Returns `undefined` for `undefined`/empty input.
 * - For values with length ≤ 4: returns `"••••"`.
 * - For longer values: returns 8 bullets followed by the last 4 chars.
 *
 * Pure, side-effect free, no imports beyond type-only.
 */
export function maskSecretValue(value: string | undefined): string | undefined {
  if (value === undefined || value.length === 0) {
    return undefined;
  }
  if (value.length <= 4) {
    return "••••";
  }
  return `••••••••${value.slice(-4)}`;
}
