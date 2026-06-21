/**
 * Parent directory domain types.
 *
 * Derived from the GraphQL `ParentDirectory` schema — these types live
 * alongside the view layer so components never depend on mock stores.
 */

/** All possible account-status values shown in the parents directory. */
export type ParentAccountStatus = "activated" | "deactivated" | "regular" | "on_leave" | "suspended" | "on_trial";

/** A single row in the parents directory data-grid / card-list. */
export interface ParentDirectoryRow {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl?: string;
  readonly guardianOf: string;
  readonly time: string;
  readonly accountStatus: ParentAccountStatus;
  readonly unpaidInvoices: number;
}
