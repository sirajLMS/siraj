"use client";

import { useCallback } from "react";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { logger } from "@/frontend/common/utils/logger";
import type { CronNotificationState, CronScheduleFormData } from "@/frontend/common/views/dashboard/cron/types";
import {
  buildScheduleInput,
  type CronScheduleInputPayload,
  getCronErrorMessage,
} from "@/frontend/common/views/dashboard/cron/useCronViewModel.helpers";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

export function useCronScheduleSaveHandler(args: {
  labels: CronLabels;
  notifications: CronNotificationState;
  refetch: () => Promise<unknown>;
  editingSchedule: CronScheduleFieldsFragment | null;
  setCreateOpen: (open: boolean) => void;
  setEditingSchedule: (row: CronScheduleFieldsFragment | null) => void;
  mutations: {
    createSchedule: (opts: { variables: { input: CronScheduleInputPayload } }) => Promise<unknown>;
    updateSchedule: (opts: { variables: { id: string; input: CronScheduleInputPayload } }) => Promise<unknown>;
  };
}) {
  const { labels, notifications, refetch, editingSchedule, mutations } = args;

  return useCallback(
    async (data: CronScheduleFormData) => {
      try {
        if (editingSchedule?.id) {
          await mutations.updateSchedule({
            variables: {
              id: editingSchedule.id,
              input: buildScheduleInput(data),
            },
          });
          notifications.showSuccess(labels.scheduleUpdated);
        } else {
          await mutations.createSchedule({
            variables: {
              input: buildScheduleInput(data),
            },
          });
          notifications.showSuccess(labels.scheduleCreated);
        }
        args.setCreateOpen(false);
        args.setEditingSchedule(null);
        await refetch();
      } catch (error) {
        logger.error("Cron save failed", { error });
        notifications.showError(
          getCronErrorMessage(error, labels, {
            scheduleId: editingSchedule?.id,
            scheduleName: data.name,
            cronExpression: data.cronExpression,
          })
        );
      }
    },
    [editingSchedule, mutations, notifications, labels, refetch, args]
  );
}
