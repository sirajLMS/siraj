import type { dstMigrationEntries, dstMigrationRuns } from "@/backend/db/schema";
import type { DstMigrationResult, MigrationStatus } from "@/backend/enum";
export type DstMigrationRunSelectType = typeof dstMigrationRuns.$inferSelect;
export type DstMigrationRunInsertType = typeof dstMigrationRuns.$inferInsert;

export type DstMigrationEntrySelectType = typeof dstMigrationEntries.$inferSelect;
export type DstMigrationEntryInsertType = typeof dstMigrationEntries.$inferInsert;

export type DstUpdatedSessionReturnType = {
  readonly id: string;
  readonly studentName: string;
  readonly teacherName: string;
  readonly fromTime: string;
  readonly toTime: string;
};

export type DstConflictItemReturnType = {
  readonly id: string;
  readonly studentName: string;
  readonly message: string;
};

export type DstConflictGroupReturnType = {
  readonly id: string;
  readonly teacherName: string;
  readonly conflicts: readonly DstConflictItemReturnType[];
};

export type DstCheckedEmptyItemReturnType = {
  readonly id: string;
  readonly studentName: string;
  readonly reason: string;
};

export type DstMigrationReportReturnType = {
  readonly id: string;
  readonly runId: string;
  readonly updated: number;
  readonly conflicts: number;
  readonly unchanged: number;
  readonly total: number;
  readonly updatedSessions: readonly DstUpdatedSessionReturnType[];
  readonly conflictGroups: readonly DstConflictGroupReturnType[];
  readonly checkedEmptyItems: readonly DstCheckedEmptyItemReturnType[];
  readonly status: MigrationStatus;
};

export type { DstMigrationResult, MigrationStatus };
