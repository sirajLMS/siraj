/**
 * Canonical registry of environment keys eligible for DB override via the Settings page.
 *
 * The Settings → Environment Config tab lists every key declared in `environment.d.ts`
 * and allows a `super_admin` (with the `SETTINGS_EDIT_ENV` permission) to override the
 * value by writing a row to `system_settings` under the prefixed key `env::<ENV_KEY>`.
 * Resolution at runtime is DB-first / env-fallback (see `env-config-resolver.ts`).
 *
 * Exclusion rules (also enforced in the resolver):
 * - `excludeFromDb: true` keys are env-only, never DB-managed, and are filtered out of
 *   `listEnvConfigEntries()` so they never reach GraphQL or the frontend. This includes
 *   boot-critical secrets (`DATABASE_URL`, `JWT_SECRET`, …) and operational keys such as
 *   `ADMIN_EMAIL`, `ALLOWED_ORIGIN`, and `IS_DEMO`.
 * - `NODE_ENV` and the serverless-platform detection flags are purely operational
 *   and are not part of this registry.
 * - `NEXT_PUBLIC_*` keys are intentionally excluded from the registry when they
 *   ARE build-time-inlined into client bundles (DB overrides at runtime would
 *   NOT reach already-shipped client code — misleading and dangerous).
 */

import { ENV_CONFIG_KEYS_APP } from "@/backend/lib/env-config-keys.registry.app";
import { ENV_CONFIG_KEYS_INTEGRATIONS } from "@/backend/lib/env-config-keys.registry.integrations";
import { ENV_CONFIG_KEYS_PROVIDERS } from "@/backend/lib/env-config-keys.registry.providers";
import { ENV_CONFIG_KEYS_WHATSAPP } from "@/backend/lib/env-config-keys.registry.whatsapp";

/**
 * Discriminated-union category for env-config keys.
 * Mirrors `EnvConfigCategory` in `backend/types/shared/env-config.types.ts` (kept
 * duplicated here to avoid a circular dependency from the lib layer into the
 * service/types layer).
 */
type EnvConfigCategory =
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
  | "whatsapp"
  | "branding"
  | "general"
  | "cron";

/**
 * How the UI should render the value in the Settings → Environment Config table.
 * - `plain`: full value visible at all times.
 * - `db_with_mask_only`: value stored verbatim in DB, but masked in the UI with an
 *   eye-toggle to reveal on demand (use for secrets — api keys, tokens, passwords).
 */
type EnvConfigDisplayStrategy = "plain" | "db_with_mask_only";

/**
 * Descriptor for one env-config key.
 */
export interface EnvConfigKeyDescriptor {
  /** The env var name as declared in `environment.d.ts`. */
  key: string;
  /** Logical grouping used by the Settings UI to render collapsible sections. */
  category: EnvConfigCategory;
  /** UI rendering strategy. `db_with_mask_only` implies `isSecret: true`. */
  displayStrategy: EnvConfigDisplayStrategy;
  /** Bilingual description shown in the UI. */
  description: { en: string; ar: string };
  /**
   * True if the value is sensitive. Paired with `displayStrategy: "db_with_mask_only"`
   * (fully masked in the UI) or, for URL-shaped values, with `maskUrlCredentials`.
   * Sensitive values are stored encrypted at rest and masked in the audit trail.
   */
  isSecret: boolean;
  /**
   * True if the key MUST NOT be DB-managed (boot-critical / chicken-and-egg secrets).
   * The UI renders these rows as read-only with `source: "env"`.
   */
  excludeFromDb: boolean;
  /**
   * True if the key must never be exposed via Settings GraphQL. Implies
   * `excludeFromDb: true` and is filtered in the env-config service layer.
   */
  serverOnly?: boolean;
  /**
   * True for URL-shaped values that may embed credentials (e.g. `redis://user:pass@host`).
   * The Settings list path masks the password component before surfacing the value
   * (a key that is ALSO `isSecret` is fully masked), and the audit trail applies the
   * same URL-credential sanitization to recorded prior/new values.
   */
  maskUrlCredentials?: boolean;
  /** Optional default value (typically undefined — the env var itself is the fallback). */
  defaultValue?: string;
}

/**
 * Canonical registry of every env-config key surfaced by the Settings page.
 * Grouped by `category` for easy scanning; the resolver turns this into a `Map`
 * keyed by `key` for O(1) lookups.
 *
 * The entries are authored in the sibling `env-config-keys.registry.*` modules and
 * concatenated here in their original order.
 *
 * Keep this array in sync with `environment.d.ts` whenever new env keys are added.
 */
export const ENV_CONFIG_KEYS: EnvConfigKeyDescriptor[] = [
  ...ENV_CONFIG_KEYS_PROVIDERS,
  ...ENV_CONFIG_KEYS_APP,
  ...ENV_CONFIG_KEYS_INTEGRATIONS,
  ...ENV_CONFIG_KEYS_WHATSAPP,
];

export function isEnvConfigKeyExposedInSettings(descriptor: EnvConfigKeyDescriptor): boolean {
  return !descriptor.excludeFromDb;
}
