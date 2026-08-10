/**
 * Canonical types for the `session_config` table (Settings → Session & Security tab).
 *
 * Only the new {@link SessionConfigUpsertInput} mutation input type is defined here.
 * The DB-derived {@link SessionConfigSelectType} and {@link SessionConfigInsertType}
 * are owned by the auth domain (`backend/types/auth/auth.types.ts`, since the
 * `session_config` table is owned by auth) and are reachable via `@/backend/types`
 * through the auth domain barrel.
 */

/**
 * Input shape accepted by `SessionConfigRepository.upsert` /
 * `SessionConfigRepository.upsertMany`. Identified by `roleName` (the unique key);
 * `ttlSeconds` and `maxConcurrentSessions` overwrite the existing row on conflict.
 */
export type SessionConfigUpsertInput = {
  roleName: string;
  ttlSeconds: number;
  maxConcurrentSessions: number;
};
