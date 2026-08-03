"use client";

import { CombinedGraphQLErrors } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  DeleteOutlined,
  EditOutlined,
  FlashOnOutlined,
  HistoryOutlined,
  PauseOutlined,
  PlayArrowOutlined,
} from "@mui/icons-material";
import { Chip, IconButton, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { CronExpressionParser } from "cron-parser";
import { useCallback, useMemo, useState } from "react";
import {
  AppPermission,
  CronConcurrencyPolicy,
  CronScheduleStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  CronRunsQuery_cronRuns_CronPaginatedRuns_rows_CronRun,
  CronScheduleFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import {
  cronQueueStatsQueryDocument,
  cronRunsQueryDocument,
  cronRunTriggerMutationDocument,
  cronScheduleCreateMutationDocument,
  cronScheduleDeleteMutationDocument,
  cronSchedulePauseMutationDocument,
  cronScheduleResumeMutationDocument,
  cronSchedulesQueryDocument,
  cronScheduleUpdateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/cron/cron.documents";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  CronNotificationState,
  CronScheduleFormData,
  CronViewProps,
} from "@/frontend/common/views/dashboard/cron/types";
import { safeEnum, safeString } from "@/frontend/common/views/dashboard/cron/utils";
import { getCronStatusColor, getCronStatusLabel } from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";
import type { CronLabels } from "@/shared/locale/types/dashboard/cron";

function useNotificationState(): CronNotificationState {
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

/**
 * Maps an Apollo/GraphQL error to a user-facing i18n message for cron operations.
 *
 * Checks `CombinedGraphQLErrors` for known `extensions.code` values (e.g.
 * `NOT_FOUND`) and maps them to the matching label. Service-level errors
 * (thrown as plain `Error` with translated messages) arrive as GraphQL errors
 * whose `message` is already localized — those are surfaced directly. Falls
 * back to `labels.errors.genericError` for unrecognised errors.
 */
function getCronErrorMessage(
  error: unknown,
  labels: CronLabels,
  context: { scheduleId?: string | null; scheduleName?: string; cronExpression?: string }
): string {
  if (CombinedGraphQLErrors.is(error)) {
    const first = error.errors[0];
    if (first) {
      const code = first.extensions?.code;
      if (code === "NOT_FOUND" && context.scheduleId) {
        return labels.errors.scheduleNotFound(context.scheduleId);
      }
      // Service-level errors arrive with a translated message but no code.
      if (first.message) {
        return first.message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return labels.errors.genericError;
}

function buildColumns(
  labels: CronLabels,
  canManage: boolean,
  handlers: {
    onEdit: (row: CronScheduleFieldsFragment) => void;
    onDelete: (row: CronScheduleFieldsFragment) => void;
    onPause: (row: CronScheduleFieldsFragment) => void;
    onResume: (row: CronScheduleFieldsFragment) => void;
    onTrigger: (row: CronScheduleFieldsFragment) => void;
    onRuns: (row: CronScheduleFieldsFragment) => void;
  }
): GridColDef<CronScheduleFieldsFragment>[] {
  const cols: GridColDef<CronScheduleFieldsFragment>[] = [
    { field: "name", headerName: labels.colName, flex: 1.2, minWidth: 150 },
    { field: "cronExpression", headerName: labels.colExpression, flex: 1, minWidth: 140 },
    { field: "jobKind", headerName: labels.colJobKind, width: 120 },
    {
      field: "status",
      headerName: labels.colStatus,
      width: 120,
      renderCell: ({ value }) => {
        const status = safeEnum(value, Object.values(CronScheduleStatus)) ?? CronScheduleStatus.Disabled;
        return <Chip size="small" color={getCronStatusColor(status)} label={getCronStatusLabel(status, labels)} />;
      },
    },
    {
      field: "nextRunAt",
      headerName: labels.colNextRun,
      width: 180,
      valueFormatter: (value: unknown) => (value ? new Date(safeString(value)).toLocaleString() : "—"),
    },
    {
      field: "lastRunAt",
      headerName: labels.colLastRun,
      width: 180,
      valueFormatter: (value: unknown) => (value ? new Date(safeString(value)).toLocaleString() : "—"),
    },
    {
      field: "concurrencyPolicy",
      headerName: labels.colConcurrencyPolicy,
      width: 140,
      renderCell: ({ value }) => {
        const policy = safeEnum(value, Object.values(CronConcurrencyPolicy));
        if (!policy) return "—";
        let label: string;
        let color: "default" | "warning" | "secondary";
        if (policy === CronConcurrencyPolicy.Allow) {
          label = labels.concurrencyAllow;
          color = "default";
        } else if (policy === CronConcurrencyPolicy.Skip) {
          label = labels.concurrencySkip;
          color = "warning";
        } else {
          label = labels.concurrencyReplace;
          color = "secondary";
        }
        return <Chip size="small" color={color} label={label} />;
      },
    },
  ];

  if (canManage) {
    cols.push({
      field: "actions",
      headerName: labels.colActions,
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.actionEdit} onClick={() => handlers.onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          {row.status === CronScheduleStatus.Active ? (
            <IconButton size="small" aria-label={labels.actionPause} onClick={() => handlers.onPause(row)}>
              <PauseOutlined fontSize="small" />
            </IconButton>
          ) : (
            <IconButton size="small" aria-label={labels.actionResume} onClick={() => handlers.onResume(row)}>
              <PlayArrowOutlined fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" aria-label={labels.actionTrigger} onClick={() => handlers.onTrigger(row)}>
            <FlashOnOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.runsTitle} onClick={() => handlers.onRuns(row)}>
            <HistoryOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.actionDelete} onClick={() => handlers.onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    });
  }

  return cols;
}

export type CronViewModel = CronViewProps;

export function useCronViewModel(): CronViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Cron);
  const locale = useAppLocale();
  const notifications = useNotificationState();

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.CronManage);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [triggeringSchedule, setTriggeringSchedule] = useState<CronScheduleFieldsFragment | null>(null);
  const [runsOpen, setRunsOpen] = useState(false);
  const [runsSchedule, setRunsSchedule] = useState<CronScheduleFieldsFragment | null>(null);

  const { data, loading, refetch } = useQuery(cronSchedulesQueryDocument, {
    variables: { input: null },
  });

  const { data: queueStatsData, loading: queueStatsLoading } = useQuery(cronQueueStatsQueryDocument, {
    pollInterval: 30000,
  });

  const { data: runsData, loading: runsLoading } = useQuery(cronRunsQueryDocument, {
    variables: {
      input: runsSchedule
        ? {
            scheduleId: runsSchedule.id ?? "",
            from: null,
            offset: 0,
            status: null,
            statuses: null,
            to: null,
            limit: 50,
          }
        : null,
    },
    skip: !runsOpen || !runsSchedule,
  });

  const [createSchedule, { loading: creating }] = useMutation(cronScheduleCreateMutationDocument);
  const [updateSchedule, { loading: updating }] = useMutation(cronScheduleUpdateMutationDocument);
  const [pauseSchedule] = useMutation(cronSchedulePauseMutationDocument);
  const [resumeSchedule] = useMutation(cronScheduleResumeMutationDocument);
  const [deleteSchedule, { loading: deleting }] = useMutation(cronScheduleDeleteMutationDocument);
  const [triggerRun] = useMutation(cronRunTriggerMutationDocument);

  const rows = useMemo(() => data?.cronSchedules?.rows ?? [], [data?.cronSchedules?.rows]);
  const queueStats = useMemo(() => queueStatsData?.cronQueueStats ?? null, [queueStatsData?.cronQueueStats]);
  const runs = useMemo<CronRunsQuery_cronRuns_CronPaginatedRuns_rows_CronRun[]>(
    () => runsData?.cronRuns?.rows ?? [],
    [runsData?.cronRuns?.rows]
  );
  const saving = creating || updating;

  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);
  const handleEditClose = useCallback(() => setEditingSchedule(null), []);

  const handleEditRow = useCallback((row: CronScheduleFieldsFragment) => {
    setEditingSchedule(row);
  }, []);

  const buildScheduleInput = useCallback((data: CronScheduleFormData) => {
    const payload = data.payload ? JSON.parse(data.payload) : null;
    const toNullOrNumber = (v: string | number): number | null => (v === "" ? null : Number(v));
    return {
      name: data.name,
      description: data.description || null,
      cronExpression: data.cronExpression,
      jobKind: data.jobKind,
      payload,
      timezone: data.timezone || null,
      concurrencyPolicy: data.concurrencyPolicy,
      maxRetries: toNullOrNumber(data.maxRetries),
      retryBackoffSeconds: toNullOrNumber(data.retryBackoffSeconds),
      timeoutSeconds: toNullOrNumber(data.timeoutSeconds),
    };
  }, []);

  const handleSave = useCallback(
    async (data: CronScheduleFormData) => {
      try {
        if (editingSchedule?.id) {
          await updateSchedule({
            variables: {
              id: editingSchedule.id,
              input: buildScheduleInput(data),
            },
          });
          notifications.showSuccess(labels.scheduleUpdated);
        } else {
          await createSchedule({
            variables: {
              input: buildScheduleInput(data),
            },
          });
          notifications.showSuccess(labels.scheduleCreated);
        }
        setCreateOpen(false);
        setEditingSchedule(null);
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
    [editingSchedule, createSchedule, updateSchedule, refetch, notifications, labels, buildScheduleInput]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingSchedule?.id) return;
    try {
      await deleteSchedule({ variables: { input: { id: deletingSchedule.id, hard: false } } });
      setDeletingSchedule(null);
      await refetch();
      notifications.showSuccess(labels.scheduleDeleted);
    } catch (error) {
      logger.error("Cron delete failed", { error });
      notifications.showError(getCronErrorMessage(error, labels, { scheduleId: deletingSchedule.id }));
    }
  }, [deletingSchedule, deleteSchedule, refetch, notifications, labels]);

  const handlePauseRow = useCallback(
    async (row: CronScheduleFieldsFragment) => {
      if (!row.id) return;
      try {
        await pauseSchedule({ variables: { id: row.id } });
        await refetch();
        notifications.showSuccess(labels.schedulePaused);
      } catch (error) {
        logger.error("Cron pause failed", { error });
        notifications.showError(getCronErrorMessage(error, labels, { scheduleId: row.id }));
      }
    },
    [pauseSchedule, refetch, notifications, labels]
  );

  const handleResumeRow = useCallback(
    async (row: CronScheduleFieldsFragment) => {
      if (!row.id) return;
      try {
        await resumeSchedule({ variables: { id: row.id } });
        await refetch();
        notifications.showSuccess(labels.scheduleResumed);
      } catch (error) {
        logger.error("Cron resume failed", { error });
        notifications.showError(getCronErrorMessage(error, labels, { scheduleId: row.id }));
      }
    },
    [resumeSchedule, refetch, notifications, labels]
  );

  const handleTriggerRow = useCallback((row: CronScheduleFieldsFragment) => {
    setTriggeringSchedule(row);
  }, []);

  const handleTriggerClose = useCallback(() => {
    setTriggeringSchedule(null);
  }, []);

  const handleTriggerConfirm = useCallback(async () => {
    if (!triggeringSchedule?.id) return;
    try {
      const result = await triggerRun({ variables: { input: { id: triggeringSchedule.id, payload: null } } });
      const triggeredRun = result.data?.cronRunTrigger;
      if (triggeredRun) {
        notifications.showSuccess(labels.scheduleTriggered);
      } else {
        notifications.showInfo(labels.triggerSkipped);
      }
    } catch (error) {
      logger.error("Cron trigger failed", { error });
      notifications.showError(getCronErrorMessage(error, labels, { scheduleId: triggeringSchedule.id }));
    } finally {
      setTriggeringSchedule(null);
    }
  }, [triggeringSchedule, triggerRun, notifications, labels]);

  const handleRunsOpen = useCallback((row: CronScheduleFieldsFragment) => {
    setRunsSchedule(row);
    setRunsOpen(true);
  }, []);
  const handleRunsClose = useCallback(() => {
    setRunsOpen(false);
    setRunsSchedule(null);
  }, []);

  const handlePreviewNextRuns = useCallback((expression: string, timezone: string): string[] => {
    if (!expression) return [];
    try {
      const interval = CronExpressionParser.parse(expression, { tz: timezone || "UTC" });
      const results: string[] = [];
      for (let i = 0; i < 3; i++) {
        const next = interval.next();
        const iso = next.toISOString();
        if (iso) results.push(iso);
      }
      return results;
    } catch {
      return [];
    }
  }, []);

  const columns = useMemo(
    () =>
      buildColumns(labels, canManage, {
        onEdit: handleEditRow,
        onDelete: setDeletingSchedule,
        onPause: handlePauseRow,
        onResume: handleResumeRow,
        onTrigger: handleTriggerRow,
        onRuns: handleRunsOpen,
      }),
    [labels, canManage, handleEditRow, handlePauseRow, handleResumeRow, handleTriggerRow, handleRunsOpen]
  );

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
    deleting,
    saving,
    triggering: Boolean(triggeringSchedule),
    triggeringSchedule,
    runsOpen,
    runsSchedule,
    runs,
    runsLoading,
    notifications,
    canManage,
    onCreateOpen: handleCreateOpen,
    onCreateClose: handleCreateClose,
    onEditRow: handleEditRow,
    onEditClose: handleEditClose,
    onSave: handleSave,
    onDeleteRow: setDeletingSchedule,
    onDeleteClose: () => setDeletingSchedule(null),
    onDeleteConfirm: handleDeleteConfirm,
    onPauseRow: handlePauseRow,
    onResumeRow: handleResumeRow,
    onTriggerRow: handleTriggerRow,
    onTriggerClose: handleTriggerClose,
    onTriggerConfirm: handleTriggerConfirm,
    onRunsOpen: handleRunsOpen,
    onRunsClose: handleRunsClose,
    onPreviewNextRuns: handlePreviewNextRuns,
  };
}
