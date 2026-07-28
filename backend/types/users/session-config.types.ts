/**
 * Canonical types for the `session_config` table (Settings → Session & Security tab).
 *
 * The DB-derived {@link SessionConfigSelectType} and {@link SessionConfigInsertType}
 * are already defined in `backend/types/auth/auth.types.ts` (since the table is
 * owned by the auth domain). They are re-exported here so consumers of the
 * `backend/types/users` barrel can import all session-config types from a single
 * location, and so Stage 4a has a clear home for the new
 * {@link SessionConfigUpsertInput} mutation input type.
 */
export type { SessionConfigInsertType, SessionConfigSelectType } from "@/backend/types/auth/auth.types";

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
