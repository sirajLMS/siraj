import type { sessionConfig } from "@/backend/db/schema";

/**
 * Canonical types for the `session_config` table (Settings → Session & Security tab).
 */

export type SessionConfigSelectType = typeof sessionConfig.$inferSelect;

/** Discriminator for typed session-config validation errors (machine-readable). */
export type SessionConfigValidationErrorCode =
  | "ETTL_OUT_OF_RANGE"
  | "EMAX_CONCURRENT_OUT_OF_RANGE"
  | "EROLE_NAME_REQUIRED";

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
