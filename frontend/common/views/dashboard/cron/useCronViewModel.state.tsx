"use client";

import { useCallback, useMemo, useState } from "react";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { CronNotificationState } from "@/frontend/common/views/dashboard/cron/types";
import { previewNextRuns } from "@/frontend/common/views/dashboard/cron/useCronViewModel.helpers";

export function useNotificationState(): CronNotificationState {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const showError = useCallback((message: string) => {
    setErrorMsg(message);
    setErrorOpen(true);
  }, []);
  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);
    setSuccessOpen(true);
  }, []);
  const showInfo = useCallback((message: string) => {
    setInfoMsg(message);
    setInfoOpen(true);
  }, []);
  const closeError = useCallback(() => setErrorOpen(false), []);
  const closeSuccess = useCallback(() => setSuccessOpen(false), []);
  const closeInfo = useCallback(() => setInfoOpen(false), []);

  return useMemo(
    () => ({
      errorOpen,
      errorMsg,
      successOpen,
      successMsg,
      infoOpen,
      infoMsg,
      showError,
      showSuccess,
      showInfo,
      closeError,
      closeSuccess,
      closeInfo,
    }),
    [
      errorOpen,
      errorMsg,
      successOpen,
      successMsg,
      infoOpen,
      infoMsg,
      showError,
      showSuccess,
      showInfo,
      closeError,
      closeSuccess,
      closeInfo,
    ]
  );
}

export function useCronDialogState() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [triggeringSchedule, setTriggeringSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [runsOpen, setRunsOpen] = useState(false);
  const [runsSchedule, setRunsSchedule] = useState<CronScheduleFieldsFragment | null>(null);

  return {
    createOpen,
    setCreateOpen,
    editingSchedule,
    setEditingSchedule,
    deletingSchedule,
    setDeletingSchedule,
    triggeringSchedule,
    setTriggeringSchedule,
    runsOpen,
    setRunsOpen,
    runsSchedule,
    setRunsSchedule,
  };
}

export function useCronHandlers(dialogState: ReturnType<typeof useCronDialogState>) {
  const { setCreateOpen, setEditingSchedule, setTriggeringSchedule, setRunsSchedule, setRunsOpen } = dialogState;

  const handleCreateOpen = useCallback(() => setCreateOpen(true), [setCreateOpen]);
  const handleCreateClose = useCallback(() => setCreateOpen(false), [setCreateOpen]);
  const handleEditClose = useCallback(() => setEditingSchedule(null), [setEditingSchedule]);
  const handleEditRow = useCallback((row: CronScheduleFieldsFragment) => setEditingSchedule(row), [setEditingSchedule]);
  const handleTriggerRow = useCallback(
    (row: CronScheduleFieldsFragment) => setTriggeringSchedule(row),
    [setTriggeringSchedule]
  );
  const handleTriggerClose = useCallback(() => setTriggeringSchedule(null), [setTriggeringSchedule]);
  const handleRunsOpen = useCallback(
    (row: CronScheduleFieldsFragment) => {
      setRunsSchedule(row);
      setRunsOpen(true);
    },
    [setRunsSchedule, setRunsOpen]
  );
  const handleRunsClose = useCallback(() => {
    setRunsOpen(false);
    setRunsSchedule(null);
  }, [setRunsOpen, setRunsSchedule]);
  const handlePreviewNextRuns = useCallback(
    (expression: string, timezone: string): string[] => previewNextRuns(expression, timezone),
    []
  );

  return {
    handleCreateOpen,
    handleCreateClose,
    handleEditClose,
    handleEditRow,
    handleTriggerRow,
    handleTriggerClose,
    handleRunsOpen,
    handleRunsClose,
    handlePreviewNextRuns,
  };
}
