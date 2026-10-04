"use client";

import { useMemo } from "react";
import type { ExecuteDstBulkUpdateMutation_executeDstBulkUpdate } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type CheckedEmptyItem,
  type ConflictGroup,
  type DstMigrationMetrics,
  MigrationStatus,
  type UpdatedSession,
} from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";

/**
 * Detects whether the browser's timezone is currently observing daylight
 * saving time. Returns the shift in minutes relative to standard time, or
 * null when no DST shift is active.
 */
export function detectDstOffsetMinutes(): number | null {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const standardOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const currentOffset = now.getTimezoneOffset();
  const dstShiftMinutes = standardOffset - currentOffset;
  if (dstShiftMinutes === 0) return null;
  return dstShiftMinutes;
}

export interface DstMigrationReportState {
  readonly metrics: DstMigrationMetrics;
  readonly migrationStatus: MigrationStatus;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
}

/**
 * Derives the view-model state (summary metrics, migration status, and the
 * normalized session/conflict/empty-check lists) from the raw bulk-update
 * mutation report. Null report fields fall back to safe defaults so tier
 * views never render partial data.
 */
export function useDstMigrationReport(
  report: ExecuteDstBulkUpdateMutation_executeDstBulkUpdate | null | undefined,
  loading: boolean
): DstMigrationReportState {
  const metrics: DstMigrationMetrics = useMemo(
    () => ({
      totalAudited: report?.total ?? 0,
      successful: report?.updated ?? 0,
      conflicts: report?.conflicts ?? 0,
      unchanged: report?.unchanged ?? 0,
    }),
    [report]
  );

  const migrationStatus: MigrationStatus = useMemo(() => {
    if (loading) return MigrationStatus.RUNNING;
    if (report) return MigrationStatus.COMPLETE;
    return MigrationStatus.IDLE;
  }, [loading, report]);

  const updatedSessions: readonly UpdatedSession[] = useMemo(
    () =>
      report?.updatedSessions?.map(s => ({
        id: s.id ?? "",
        studentId: s.studentId ?? "",
        teacherId: s.teacherId ?? "",
        studentName: s.studentName ?? "",
        teacherName: s.teacherName ?? "",
        fromTime: s.fromTime ?? "",
        toTime: s.toTime ?? "",
      })) ?? [],
    [report]
  );

  const conflictGroups: readonly ConflictGroup[] = useMemo(
    () =>
      report?.conflictGroups?.map(g => ({
        id: g.id ?? "",
        teacherName: g.teacherName ?? "",
        conflicts:
          g.conflicts?.map(c => ({
            id: c.id ?? "",
            studentName: c.studentName ?? "",
            message: c.message ?? "",
          })) ?? [],
      })) ?? [],
    [report]
  );

  const checkedEmptyItems: readonly CheckedEmptyItem[] = useMemo(
    () =>
      report?.checkedEmptyItems?.map(i => ({
        id: i.id ?? "",
        studentName: i.studentName ?? "",
        reason: i.reason ?? "",
      })) ?? [],
    [report]
  );

  return {
    metrics,
    migrationStatus,
    updatedSessions,
    conflictGroups,
    checkedEmptyItems,
  };
}
