"use client";

import type { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback } from "react";
import { logger } from "@/frontend/common/utils/logger";

type ScheduleMutationRunner = (args: {
  readonly action: () => Promise<unknown>;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) => Promise<void>;

type DeleteClassFn = (opts: { variables: { classInstanceId: string } }) => Promise<unknown>;
type ClearWeeklyFn = (opts: { variables: { teacherId: string } }) => Promise<unknown>;

function useScheduleRefetcher(refetchSchedule: () => Promise<unknown>, refetchWorkload: () => Promise<unknown>) {
  return useCallback(async () => {
    await refetchSchedule();
    await refetchWorkload();
  }, [refetchSchedule, refetchWorkload]);
}

function useScheduleMutationRunner(args: {
  readonly refetchSchedule: () => Promise<unknown>;
  readonly refetchWorkload: () => Promise<unknown>;
  readonly notifications: ReturnType<typeof useNotifications>;
}) {
  const { refetchSchedule, refetchWorkload, notifications } = args;
  return useCallback<ScheduleMutationRunner>(
    async ({ action, onSuccessLabel, onErrorLabel, errorLogMsg }) => {
      try {
        await action();
        await refetchSchedule();
        await refetchWorkload();
        notifications.show(onSuccessLabel, { severity: "success" });
      } catch (error) {
        logger.error(errorLogMsg, { error });
        notifications.show(onErrorLabel, { severity: "error" });
      }
    },
    [refetchSchedule, refetchWorkload, notifications]
  );
}

function useGridClassRemoval(args: {
  readonly deleteRecurringClass: DeleteClassFn;
  readonly runMutation: ScheduleMutationRunner;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) {
  const { deleteRecurringClass, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg } = args;
  return useCallback(
    async (classInstanceId: string) => {
      await runMutation({
        action: () => deleteRecurringClass({ variables: { classInstanceId } }),
        onSuccessLabel,
        onErrorLabel,
        errorLogMsg,
      });
    },
    [deleteRecurringClass, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg]
  );
}

function useScheduleClear(args: {
  readonly clearWeeklySchedule: ClearWeeklyFn;
  readonly teacherId: string;
  readonly runMutation: ScheduleMutationRunner;
  readonly onSuccessLabel: string;
  readonly onErrorLabel: string;
  readonly errorLogMsg: string;
}) {
  const { clearWeeklySchedule, teacherId, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg } = args;
  return useCallback(async () => {
    await runMutation({
      action: () => clearWeeklySchedule({ variables: { teacherId } }),
      onSuccessLabel,
      onErrorLabel,
      errorLogMsg,
    });
  }, [clearWeeklySchedule, teacherId, runMutation, onSuccessLabel, onErrorLabel, errorLogMsg]);
}

export type ScheduleActionHandlers = {
  readonly handleRefetch: () => Promise<void>;
  readonly handleRemoveClass: (classInstanceId: string) => Promise<void>;
  readonly handleClearSchedule: () => Promise<void>;
};

export function useScheduleActionHandlers(args: {
  readonly teacherId: string;
  readonly refetchSchedule: () => Promise<unknown>;
  readonly refetchWorkload: () => Promise<unknown>;
  readonly notifications: ReturnType<typeof useNotifications>;
  readonly deleteRecurringClass: DeleteClassFn;
  readonly clearWeeklySchedule: ClearWeeklyFn;
  readonly classDeletedLabel: string;
  readonly classDeleteFailedLabel: string;
  readonly scheduleClearedLabel: string;
  readonly scheduleClearFailedLabel: string;
}): ScheduleActionHandlers {
  const {
    teacherId,
    refetchSchedule,
    refetchWorkload,
    notifications,
    deleteRecurringClass,
    clearWeeklySchedule,
    classDeletedLabel,
    classDeleteFailedLabel,
    scheduleClearedLabel,
    scheduleClearFailedLabel,
  } = args;
  const handleRefetch = useScheduleRefetcher(refetchSchedule, refetchWorkload);
  const runScheduleMutation = useScheduleMutationRunner({ refetchSchedule, refetchWorkload, notifications });
  const handleRemoveClass = useGridClassRemoval({
    deleteRecurringClass,
    runMutation: runScheduleMutation,
    onSuccessLabel: classDeletedLabel,
    onErrorLabel: classDeleteFailedLabel,
    errorLogMsg: "Failed to delete class instance",
  });
  const handleClearSchedule = useScheduleClear({
    clearWeeklySchedule,
    teacherId,
    runMutation: runScheduleMutation,
    onSuccessLabel: scheduleClearedLabel,
    onErrorLabel: scheduleClearFailedLabel,
    errorLogMsg: "Failed to clear weekly schedule",
  });
  return { handleRefetch, handleRemoveClass, handleClearSchedule };
}
