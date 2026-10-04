"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { executeDstBulkUpdateMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type {
  CheckedEmptyItem,
  ConflictGroup,
  DstMigrationMetrics,
  MigrationStatus,
  UpdatedSession,
} from "@/frontend/common/views/dashboard/tools/dst-migration/dst-migration.types";
import {
  detectDstOffsetMinutes,
  useDstMigrationReport,
} from "@/frontend/common/views/dashboard/tools/dst-migration/useDstMigrationViewModel.helpers";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { DstMigrationLabels } from "@/shared/locale/types/dashboard/admin/dstMigration";

const NOTIFICATION_DURATION_MS = 5000;

export interface DstMigrationViewModel {
  readonly labels: DstMigrationLabels;
  readonly metrics: DstMigrationMetrics;
  readonly updatedSessions: readonly UpdatedSession[];
  readonly conflictGroups: readonly ConflictGroup[];
  readonly checkedEmptyItems: readonly CheckedEmptyItem[];
  readonly migrationStatus: MigrationStatus;
  readonly onUpdate: () => Promise<void>;
  readonly dstOffsetDetected: boolean;
  readonly requiredPermission: AppPermission;
}

export function useDstMigrationViewModel(): DstMigrationViewModel {
  const notifications = useNotifications();
  const labels = useAppTranslation(Translation.Dashboard.AdminDstMigration);
  const [executeDstUpdate, { loading, data }] = useMutation(executeDstBulkUpdateMutationDocument);

  const { metrics, migrationStatus, updatedSessions, conflictGroups, checkedEmptyItems } = useDstMigrationReport(
    data?.executeDstBulkUpdate,
    loading
  );

  const onUpdate = async () => {
    try {
      const offsetMinutes = detectDstOffsetMinutes();
      if (offsetMinutes === null) {
        notifications.show(labels.errors.noDstTransitionDetected, {
          severity: "warning",
          autoHideDuration: NOTIFICATION_DURATION_MS,
        });
        return;
      }
      await executeDstUpdate({
        variables: {
          offsetMinutes,
          description: `DST adjustment of ${offsetMinutes} minutes executed by admin`,
        },
      });
      notifications.show(labels.actions.successMessage, {
        severity: "success",
        autoHideDuration: NOTIFICATION_DURATION_MS,
      });
    } catch (error) {
      logger.error("DST bulk update failed", { error });
      notifications.show(labels.errors.mutationFailed, {
        severity: "error",
        autoHideDuration: NOTIFICATION_DURATION_MS,
      });
    }
  };

  return {
    labels,
    metrics,
    updatedSessions,
    conflictGroups,
    checkedEmptyItems,
    migrationStatus,
    onUpdate,
    dstOffsetDetected: detectDstOffsetMinutes() !== null,
    requiredPermission: AppPermission.SystemBulkUpdateDst,
  };
}
