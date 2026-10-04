"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import { useCronRowActionHandlers } from "@/frontend/common/views/dashboard/cron/useCronViewModel.actions";
import { useCronColumns } from "@/frontend/common/views/dashboard/cron/useCronViewModel.columns";
import { useCronMutations, useCronQueries } from "@/frontend/common/views/dashboard/cron/useCronViewModel.queries";
import { useCronScheduleSaveHandler } from "@/frontend/common/views/dashboard/cron/useCronViewModel.save";
import {
  useCronDialogState,
  useCronHandlers,
  useNotificationState,
} from "@/frontend/common/views/dashboard/cron/useCronViewModel.state";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

export type CronViewModel = CronViewProps;

export function useCronViewModel(): CronViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Cron);
  const locale = useAppLocale();
  const notifications = useNotificationState();

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.CronManage);

  const dialogState = useCronDialogState();
  const { createOpen, editingSchedule, deletingSchedule, triggeringSchedule, runsOpen, runsSchedule } = dialogState;

  const { rows, queueStats, runs, loading, queueStatsLoading, runsLoading, refetch } = useCronQueries(
    runsSchedule,
    runsOpen
  );

  const mutations = useCronMutations();
  const handlers = useCronHandlers(dialogState);

  const handleSave = useCronScheduleSaveHandler({
    labels,
    notifications,
    refetch,
    editingSchedule,
    setCreateOpen: dialogState.setCreateOpen,
    setEditingSchedule: dialogState.setEditingSchedule,
    mutations: {
      createSchedule: mutations.createSchedule,
      updateSchedule: mutations.updateSchedule,
    },
  });

  const rowActions = useCronRowActionHandlers({
    labels,
    notifications,
    refetch,
    deletingSchedule,
    setDeletingSchedule: dialogState.setDeletingSchedule,
    triggeringSchedule,
    setTriggeringSchedule: dialogState.setTriggeringSchedule,
    mutations: {
      deleteSchedule: mutations.deleteSchedule,
      pauseSchedule: mutations.pauseSchedule,
      resumeSchedule: mutations.resumeSchedule,
      triggerRun: mutations.triggerRun,
    },
  });

  const columns = useCronColumns(labels, canManage, {
    onEdit: handlers.handleEditRow,
    onDelete: dialogState.setDeletingSchedule,
    onPause: rowActions.onPauseRow,
    onResume: rowActions.onResumeRow,
    onTrigger: handlers.handleTriggerRow,
    onRuns: handlers.handleRunsOpen,
  });

  return {
    labels,
    locale,
    rows,
    columns,
    loading,
    queueStats,
    queueStatsLoading,
    createOpen,
    editingSchedule,
    deletingSchedule,
    deleting: mutations.deleting,
    saving: mutations.saving,
    triggering: Boolean(triggeringSchedule),
    triggeringSchedule,
    runsOpen,
    runsSchedule,
    runs,
    runsLoading,
    notifications,
    canManage,
    onCreateOpen: handlers.handleCreateOpen,
    onCreateClose: handlers.handleCreateClose,
    onEditRow: handlers.handleEditRow,
    onEditClose: handlers.handleEditClose,
    onSave: handleSave,
    onDeleteRow: dialogState.setDeletingSchedule,
    onDeleteClose: () => dialogState.setDeletingSchedule(null),
    onDeleteConfirm: rowActions.onDeleteConfirm,
    onPauseRow: rowActions.onPauseRow,
    onResumeRow: rowActions.onResumeRow,
    onTriggerRow: handlers.handleTriggerRow,
    onTriggerClose: handlers.handleTriggerClose,
    onTriggerConfirm: rowActions.onTriggerConfirm,
    onRunsOpen: handlers.handleRunsOpen,
    onRunsClose: handlers.handleRunsClose,
    onPreviewNextRuns: handlers.handlePreviewNextRuns,
  };
}
