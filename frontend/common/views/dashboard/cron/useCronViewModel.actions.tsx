"use client";

import { useCallback } from "react";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { CronNotificationState } from "@/frontend/common/views/dashboard/cron/types";
import { getCronErrorMessage } from "@/frontend/common/views/dashboard/cron/useCronViewModel.helpers";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

interface CronRowActionHandlers {
  onDeleteConfirm: () => Promise<void>;
  onPauseRow: (row: CronScheduleFieldsFragment) => Promise<void>;
  onResumeRow: (row: CronScheduleFieldsFragment) => Promise<void>;
  onTriggerConfirm: () => Promise<void>;
}

export function useCronRowActionHandlers(args: {
  labels: CronLabels;
  notifications: CronNotificationState;
  refetch: () => Promise<unknown>;
  deletingSchedule: CronScheduleFieldsFragment | null;
  setDeletingSchedule: (row: CronScheduleFieldsFragment | null) => void;
  triggeringSchedule: CronScheduleFieldsFragment | null;
  setTriggeringSchedule: (row: CronScheduleFieldsFragment | null) => void;
  mutations: {
    deleteSchedule: (opts: { variables: { input: { id: string; hard: boolean } } }) => Promise<unknown>;
    pauseSchedule: (opts: { variables: { id: string } }) => Promise<unknown>;
    resumeSchedule: (opts: { variables: { id: string } }) => Promise<unknown>;
    triggerRun: (opts: {
      variables: { input: { id: string; payload: null } };
    }) => Promise<{ data?: { cronRunTrigger?: unknown } }>;
  };
}): CronRowActionHandlers {
  const { labels, notifications, refetch, mutations } = args;

  const onDeleteConfirm = useCallback(async () => {
    const target = args.deletingSchedule;
    if (!target?.id) return;
    try {
      await mutations.deleteSchedule({ variables: { input: { id: target.id, hard: false } } });
      args.setDeletingSchedule(null);
      await refetch();
      notifications.showSuccess(labels.scheduleDeleted);
    } catch (error) {
      logger.error("Cron delete failed", { error });
      notifications.showError(getCronErrorMessage(error, labels, { scheduleId: target.id }));
    }
  }, [args, mutations, refetch, notifications, labels]);

  const onPauseRow = useCallback(
    async (row: CronScheduleFieldsFragment) => {
      if (!row.id) return;
      try {
        await mutations.pauseSchedule({ variables: { id: row.id } });
        await refetch();
        notifications.showSuccess(labels.schedulePaused);
      } catch (error) {
        logger.error("Cron pause failed", { error });
        notifications.showError(getCronErrorMessage(error, labels, { scheduleId: row.id }));
      }
    },
    [mutations, refetch, notifications, labels]
  );

  const onResumeRow = useCallback(
    async (row: CronScheduleFieldsFragment) => {
      if (!row.id) return;
      try {
        await mutations.resumeSchedule({ variables: { id: row.id } });
        await refetch();
        notifications.showSuccess(labels.scheduleResumed);
      } catch (error) {
        logger.error("Cron resume failed", { error });
        notifications.showError(getCronErrorMessage(error, labels, { scheduleId: row.id }));
      }
    },
    [mutations, refetch, notifications, labels]
  );

  const onTriggerConfirm = useCallback(async () => {
    const target = args.triggeringSchedule;
    if (!target?.id) return;
    try {
      const result = await mutations.triggerRun({
        variables: { input: { id: target.id, payload: null } },
      });
      const triggeredRun = result.data?.cronRunTrigger;
      if (triggeredRun) {
        notifications.showSuccess(labels.scheduleTriggered);
      } else {
        notifications.showInfo(labels.triggerSkipped);
      }
    } catch (error) {
      logger.error("Cron trigger failed", { error });
      notifications.showError(getCronErrorMessage(error, labels, { scheduleId: target.id }));
    } finally {
      args.setTriggeringSchedule(null);
    }
  }, [args, mutations, notifications, labels]);

  return { onDeleteConfirm, onPauseRow, onResumeRow, onTriggerConfirm };
}
