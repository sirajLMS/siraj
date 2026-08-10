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

type CronRow = CronScheduleFieldsFragment;

interface MobileScheduleRowProps {
  readonly row: CronRow;
  readonly labels: CronViewProps["labels"];
  readonly canManage: boolean;
  readonly onEdit: (row: CronRow) => void;
  readonly onDelete: (row: CronRow) => void;
  readonly onPause: (row: CronRow) => void;
  readonly onResume: (row: CronRow) => void;
  readonly onTrigger: (row: CronRow) => void;
  readonly onRuns: (row: CronRow) => void;
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

interface CronMobileDialogsProps {
  readonly deletingSchedule: CronViewProps["deletingSchedule"];
  readonly deleting: CronViewProps["deleting"];
  readonly createOpen: CronViewProps["createOpen"];
  readonly editingSchedule: CronViewProps["editingSchedule"];
  readonly saving: CronViewProps["saving"];
  readonly runsOpen: CronViewProps["runsOpen"];
  readonly runsSchedule: CronViewProps["runsSchedule"];
  readonly runs: CronViewProps["runs"];
  readonly runsLoading: CronViewProps["runsLoading"];
  readonly triggering: CronViewProps["triggering"];
  readonly triggeringSchedule: CronViewProps["triggeringSchedule"];
  readonly labels: CronViewProps["labels"];
  readonly onDeleteClose: CronViewProps["onDeleteClose"];
  readonly onDeleteConfirm: CronViewProps["onDeleteConfirm"];
  readonly onEditClose: CronViewProps["onEditClose"];
  readonly onCreateClose: CronViewProps["onCreateClose"];
  readonly onSave: CronViewProps["onSave"];
  readonly onPreviewNextRuns: CronViewProps["onPreviewNextRuns"];
  readonly onRunsClose: CronViewProps["onRunsClose"];
  readonly onTriggerClose: CronViewProps["onTriggerClose"];
  readonly onTriggerConfirm: CronViewProps["onTriggerConfirm"];
}

function CronMobileDialogs({
  deletingSchedule,
  deleting,
  createOpen,
  editingSchedule,
  saving,
  runsOpen,
  runsSchedule,
  runs,
  runsLoading,
  triggering,
  triggeringSchedule,
  labels,
  onDeleteClose,
  onDeleteConfirm,
  onEditClose,
  onCreateClose,
  onSave,
  onPreviewNextRuns,
  onRunsClose,
  onTriggerClose,
  onTriggerConfirm,
}: CronMobileDialogsProps) {
  return (
    <>
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
    </>
  );
}

interface CronMobileNotificationsProps {
  readonly notifications: CronViewProps["notifications"];
}

function CronMobileNotifications({ notifications }: CronMobileNotificationsProps) {
  return (
    <>
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
    </>
  );
}

function CronMobileQueueAlerts({
  queueStats,
  queueStatsLoading,
  loading,
  rows,
  labels,
}: {
  readonly queueStats: CronViewProps["queueStats"];
  readonly queueStatsLoading: CronViewProps["queueStatsLoading"];
  readonly loading: CronViewProps["loading"];
  readonly rows: CronViewProps["rows"];
  readonly labels: CronViewProps["labels"];
}) {
  return (
    <>
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
    </>
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

      <CronMobileQueueAlerts
        queueStats={queueStats}
        queueStatsLoading={queueStatsLoading}
        loading={loading}
        rows={rows}
        labels={labels}
      />

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

      <CronMobileDialogs
        deletingSchedule={deletingSchedule}
        deleting={deleting}
        createOpen={createOpen}
        editingSchedule={editingSchedule}
        saving={saving}
        runsOpen={runsOpen}
        runsSchedule={runsSchedule}
        runs={runs}
        runsLoading={runsLoading}
        triggering={triggering}
        triggeringSchedule={triggeringSchedule}
        labels={labels}
        onDeleteClose={onDeleteClose}
        onDeleteConfirm={onDeleteConfirm}
        onEditClose={onEditClose}
        onCreateClose={onCreateClose}
        onSave={onSave}
        onPreviewNextRuns={onPreviewNextRuns}
        onRunsClose={onRunsClose}
        onTriggerClose={onTriggerClose}
        onTriggerConfirm={onTriggerConfirm}
      />

      <CronMobileNotifications notifications={notifications} />

      {canManage ? <MobileFab icon={<AddOutlined />} label={labels.actionCreate} onClick={onCreateOpen} /> : null}
    </MobilePageContainer>
  );
}
