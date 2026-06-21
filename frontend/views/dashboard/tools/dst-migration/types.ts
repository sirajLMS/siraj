/**
 * DST Migration view-layer types.
 *
 * These types describe the UI model for the DST migration tool.
 * They are intentionally defined here (not in a mock store) so that
 * components depend only on local domain types.
 */

export interface UpdatedSession {
  readonly id: string;
  readonly className: string;
  readonly section: string;
  readonly teacher: string;
  readonly fromTime: string;
  readonly toTime: string;
}

export interface ConflictItem {
  readonly id: string;
  readonly className: string;
  readonly message: string;
}

export interface ConflictGroup {
  readonly id: string;
  readonly teacherName: string;
  readonly conflicts: readonly ConflictItem[];
}

export interface CheckedEmptyItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface DstMigrationMetrics {
  readonly totalAudited: number;
  readonly successful: number;
  readonly conflicts: number;
  readonly unchanged: number;
}

export type MigrationStatus = "idle" | "running" | "complete";
