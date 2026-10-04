/**
 * Audit-specific types for environment config changes.
 *
 * These describe the audit log entries emitted when DB overrides under the
 * `env::<key>` namespace in `system_settings` are upserted or deleted, and
 * the input accepted by audit write helpers.
 *
 * Pure types only — no runtime values, no helpers, no side effects.
 */

/** Discriminator for the kind of env-config change being audited. */
export type EnvConfigAuditEvent = "env_config.upsert" | "env_config.delete";
