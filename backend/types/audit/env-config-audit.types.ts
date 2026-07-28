/**
 * Audit-specific types for environment config changes.
 *
 * These describe the audit log entries emitted when DB overrides under the
 * `env::<key>` namespace in `system_settings` are upserted or deleted, along
 * with the filter/pagination types for the GraphQL list query and the input
 * accepted by audit write helpers.
 *
 * Pure types only — no runtime values, no helpers, no side effects.
 */

/** Discriminator for the kind of env-config change being audited. */
export type EnvConfigAuditEvent = "env_config.upsert" | "env_config.delete";

/** A single audit log entry for an env-config change. */
export interface EnvConfigAuditLogEntry {
  /** uuid */
  id: string;
  actorUserId: string;
  actorDisplayName?: string;
  event: EnvConfigAuditEvent;
  /** Env var name, e.g. `"SMTP_HOST"`. */
  key: string;
  actorIpAddress?: string;
  userAgent?: string;
  /** `"***"` if secret; omitted on create. */
  priorValue?: string;
  /** `"***"` if secret; omitted on delete. */
  newValue?: string;
  createdAt: Date;
}

/** Filter options for the env-config audit log GraphQL list query. */
export interface EnvConfigAuditFilterInput {
  event?: EnvConfigAuditEvent;
  key?: string;
  actorUserId?: string;
  fromDate?: Date;
  toDate?: Date;
}

/** Paginated result of an env-config audit log query. */
export interface EnvConfigAuditListResult {
  items: EnvConfigAuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Input accepted by env-config audit write helpers. */
export interface EnvConfigAuditCreateInput {
  actorUserId: string;
  event: EnvConfigAuditEvent;
  key: string;
  priorValue?: string;
  newValue?: string;
  actorIpAddress?: string;
  userAgent?: string;
}
