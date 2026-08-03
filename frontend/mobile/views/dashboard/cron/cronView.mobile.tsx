"use client";

import {
  AddOutlined,
  DeleteOutlined,
  EditOutlined,
  FlashOnOutlined,
  HistoryOutlined,
  PauseOutlined,
  PlayArrowOutlined,
} from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Snackbar, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { CronScheduleStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import { CronManualTriggerDialog } from "@/frontend/common/views/dashboard/cron/components/CronManualTriggerDialog";
import { CronRunsDialog } from "@/frontend/common/views/dashboard/cron/components/CronRunsDialog";
import { CronScheduleCreateEditDialog } from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import { getCronStatusColor, getCronStatusLabel } from "@/frontend/common/views/dashboard/cron/utils/cron-status-utils";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileCardListItem,
  MobileFab,
  MobileFormErrorSnackbar,
  MobileFormSuccessSnackbar,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

interface MobileScheduleRowProps {
  readonly row: CronScheduleFieldsFragment;
  readonly labels: CronViewProps["labels"];
  readonly canManage: boolean;
  readonly onEdit: (row: CronScheduleFieldsFragment) => void;
  readonly onDelete: (row: CronScheduleFieldsFragment) => void;
  readonly onPause: (row: CronScheduleFieldsFragment) => void;
  readonly onResume: (row: CronScheduleFieldsFragment) => void;
  readonly onTrigger: (row: CronScheduleFieldsFragment) => void;
  readonly onRuns: (row: CronScheduleFieldsFragment) => void;
}

function MobileScheduleRow({
  row,
  labels,
  canManage,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onTrigger,
  onRuns,
}: MobileScheduleRowProps) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ p: 2, width: "100%", overflow: "hidden" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ typography: "titleLg", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.name}
              </Box>
              <Box sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>
                {row.cronExpression}
              </Box>
            </Box>
            <Chip
              size="small"
              color={getCronStatusColor(row.status ?? CronScheduleStatus.Disabled)}
              label={getCronStatusLabel(row.status ?? CronScheduleStatus.Disabled, labels)}
            />
          </Stack>

          {row.description ? (
            <Box sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>{row.description}</Box>
          ) : null}

          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            <Chip size="small" variant="outlined" label={`${labels.colJobKind}: ${row.jobKind ?? ""}`} />
            {row.nextRunAt ? (
              <Chip
                size="small"
                variant="outlined"
                label={`${labels.colNextRun}: ${new Date(row.nextRunAt).toLocaleString()}`}
              />
            ) : null}
          </Stack>

          {canManage ? (
            <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
              <IconButton size="small" aria-label={labels.actionEdit} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              {row.status === CronScheduleStatus.Active ? (
                <IconButton size="small" aria-label={labels.actionPause} onClick={() => onPause(row)}>
                  <PauseOutlined fontSize="small" />
                </IconButton>
              ) : (
                <IconButton size="small" aria-label={labels.actionResume} onClick={() => onResume(row)}>
                  <PlayArrowOutlined fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" aria-label={labels.actionTrigger} onClick={() => onTrigger(row)}>
                <FlashOnOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.runsTitle} onClick={() => onRuns(row)}>
                <HistoryOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.actionDelete} onClick={() => onDelete(row)}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}

export function CronMobileView({
  labels,
  rows,
  loading,
  queueStats,
  queueStatsLoading,
  createOpen,
  editingSchedule,
  deletingSchedule,
  deleting,
  saving,
  triggering,
  triggeringSchedule,
  runsOpen,
  runsSchedule,
  runs,
  runsLoading,
  notifications,
  canManage,
  onCreateOpen,
  onCreateClose,
  onEditClose,
  onSave,
  onDeleteRow,
  onDeleteClose,
  onDeleteConfirm,
  onEditRow,
  onPauseRow,
  onResumeRow,
  onTriggerRow,
  onTriggerClose,
  onTriggerConfirm,
  onRunsOpen,
  onRunsClose,
  onPreviewNextRuns,
}: Readonly<CronViewProps>) {
  const renderItem = (row: CronScheduleFieldsFragment): ReactNode => (
    <MobileScheduleRow
      row={row}
      labels={labels}
      canManage={canManage}
      onEdit={onEditRow}
      onDelete={onDeleteRow}
      onPause={onPauseRow}
      onResume={onResumeRow}
      onTrigger={onTriggerRow}
      onRuns={onRunsOpen}
    />
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />

      {queueStats && !queueStatsLoading ? (
        <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
          {labels.queueStatsTitle} ({queueStats.backend}): {labels.queueStatsPending} = {queueStats.pending},{" "}
          {labels.queueStatsInFlight} = {queueStats.inFlight}, {labels.queueStatsFailed} = {queueStats.failed}
        </Alert>
      ) : null}

      {!loading && rows.length === 0 ? (
        <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
          {labels.pageSubtitle}
        </Alert>
      ) : null}

      <MobileCardList
        rows={rows}
        loading={loading}
        emptyMessage={labels.pageSubtitle}
        gap={1.5}
        layout="edge-to-edge"
        getKey={row => row.id ?? `row-${row.name}`}
        renderItem={renderItem}
        paginationOptions={{ mode: "client" }}
      />

      <MobileBaseDeleteDialog
        open={Boolean(deletingSchedule)}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        isLoading={deleting}
        title={labels.actionDelete}
        body={`${labels.actionDelete}: ${deletingSchedule?.name ?? ""}`}
        cancelLabel={labels.actionCancel}
        confirmLabel={labels.actionDelete}
      />

      <CronScheduleCreateEditDialog
        open={createOpen || editingSchedule != null}
        editingSchedule={editingSchedule}
        labels={labels}
        saving={saving}
        previewNextRuns={onPreviewNextRuns}
        onClose={editingSchedule ? onEditClose : onCreateClose}
        onSave={onSave}
      />

      <CronRunsDialog
        open={runsOpen}
        scheduleName={runsSchedule?.name ?? null}
        labels={labels}
        runs={runs}
        loading={runsLoading}
        onClose={onRunsClose}
      />

      <CronManualTriggerDialog
        open={triggering}
        schedule={triggeringSchedule}
        labels={labels}
        triggering={triggering}
        onConfirm={onTriggerConfirm}
        onClose={onTriggerClose}
      />

      <MobileFormErrorSnackbar
        open={notifications.errorOpen}
        message={notifications.errorMsg}
        onClose={notifications.closeError}
      />
      <MobileFormSuccessSnackbar
        open={notifications.successOpen}
        message={notifications.successMsg}
        onClose={notifications.closeSuccess}
      />
      <Snackbar
        open={notifications.infoOpen}
        autoHideDuration={6000}
        onClose={notifications.closeInfo}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={notifications.closeInfo} sx={{ width: "100%" }}>
          {notifications.infoMsg}
        </Alert>
      </Snackbar>

      {canManage ? <MobileFab icon={<AddOutlined />} label={labels.actionCreate} onClick={onCreateOpen} /> : null}
    </MobilePageContainer>
  );
}
