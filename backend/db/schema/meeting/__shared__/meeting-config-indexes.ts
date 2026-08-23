import { sql } from "drizzle-orm";
import { type PgColumn } from "drizzle-orm/pg-core";
import { index, uniqueIndex } from "@/backend/db/schema/__shared__/dialectAwareBuilder";

/**
 * Builder helpers for the index/unique-index clauses shared by
 * `class_meeting_configs` and `user_meeting_configs`. Extracted to
 * eliminate SonarQube duplication of the `provider_id` index and the
 * "one default per scope" partial unique index pattern.
 */

/**
 * Returns the `provider_id` non-unique index for a meeting configs table.
 *
 * @param tableName - DB table name, e.g. `"class_meeting_configs"`.
 * @param table     - Drizzle table object (exposed via the `pgTable` extra
 *   config callback). Must expose a `providerId` column.
 */
export function meetingConfigProviderIndex(tableName: string, table: { providerId: PgColumn }) {
  return index(`${tableName}_provider_id_idx`).on(table.providerId);
}

/**
 * Returns a partial unique index enforcing "at most one default config per
 * scope" for a single scope column (e.g. `user_id`).
 *
 * @param tableName    - DB table name, e.g. `"user_meeting_configs"`.
 * @param scopeLabel   - Label segment for the index name, e.g. `"per_user"`.
 * @param columnRef    - Drizzle column reference, e.g. `table.userId`.
 * @param isDefaultRef - Drizzle column reference for `is_default`.
 */
export function meetingConfigOneDefaultPerScopeIndex(
  tableName: string,
  scopeLabel: string,
  columnRef: PgColumn,
  isDefaultRef: PgColumn
) {
  return uniqueIndex(`${tableName}_one_default_${scopeLabel}_idx`).on(columnRef).where(sql`${isDefaultRef} = true`);
}

/**
 * Returns a partial unique index enforcing "at most one default config per
 * scope" where the scope column is nullable (e.g. `class_instance_id` or
 * `recurring_schedule_id`), so the index only applies when the column is
 * set.
 *
 * @param tableName    - DB table name, e.g. `"class_meeting_configs"`.
 * @param scopeLabel   - Label segment for the index name, e.g. `"per_instance"`.
 * @param columnRef    - Drizzle column reference, e.g. `table.classInstanceId`.
 * @param isDefaultRef - Drizzle column reference for `is_default`.
 */
export function meetingConfigOneDefaultPerNullableScopeIndex(
  tableName: string,
  scopeLabel: string,
  columnRef: PgColumn,
  isDefaultRef: PgColumn
) {
  return uniqueIndex(`${tableName}_one_default_${scopeLabel}_idx`)
    .on(columnRef)
    .where(sql`${isDefaultRef} = true AND ${columnRef} IS NOT NULL`);
}
