"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { executeDstBulkUpdateMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import { DstMigrationView } from "@/frontend/views/dashboard/tools/dst-migration/DstMigrationView";
import {
  type CheckedEmptyItem,
  type ConflictGroup,
  type DstMigrationMetrics,
  MigrationStatus,
  type UpdatedSession,
} from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";

function detectDstOffsetMinutes(): number | null {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const standardOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  const currentOffset = now.getTimezoneOffset();
  const dstShiftMinutes = standardOffset - currentOffset;
  if (dstShiftMinutes === 0) return null;
  return dstShiftMinutes;
}

export function DstMigrationContainer() {
  const notifications = useNotifications();
  const t = useTranslations("dashboard.dstMigration");
  const [executeDstUpdate, { loading, data }] = useMutation(executeDstBulkUpdateMutationDocument);

  const report = data?.executeDstBulkUpdate;

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

  const handleUpdate = async () => {
    try {
      const offsetMinutes = detectDstOffsetMinutes();
      if (offsetMinutes === null) {
        notifications.show(t("errors.noDstTransitionDetected"), {
          severity: "warning",
          autoHideDuration: 5000,
        });
        return;
      }
      await executeDstUpdate({
        variables: {
          offsetMinutes,
          description: `DST adjustment of ${offsetMinutes} minutes executed by admin`,
        },
      });
      notifications.show(t("actions.successMessage"), {
        severity: "success",
        autoHideDuration: 5000,
      });
    } catch (error) {
      logger.error("DST bulk update failed", { error });
      notifications.show(t("errors.mutationFailed"), {
        severity: "error",
        autoHideDuration: 5000,
      });
    }
  };

  return (
    <RequirePermission permissions={[AppPermission.SystemBulkUpdateDst]}>
      <DstMigrationView
        metrics={metrics}
        updatedSessions={updatedSessions}
        conflictGroups={conflictGroups}
        checkedEmptyItems={checkedEmptyItems}
        migrationStatus={migrationStatus}
        onUpdate={handleUpdate}
        dstOffsetDetected={detectDstOffsetMinutes() !== null}
      />
    </RequirePermission>
  );
}
