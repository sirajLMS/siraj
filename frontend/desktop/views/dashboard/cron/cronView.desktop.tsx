"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert, Box, Snackbar, Stack } from "@mui/material";
import { CronManualTriggerDialog } from "@/frontend/common/views/dashboard/cron/components/CronManualTriggerDialog";
import { CronRunsDialog } from "@/frontend/common/views/dashboard/cron/components/CronRunsDialog";
import { CronScheduleCreateEditDialog } from "@/frontend/common/views/dashboard/cron/components/CronScheduleCreateEditDialog";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import {
  DesktopAppDataGrid,
  DesktopFormErrorSnackbar,
  DesktopFormSuccessSnackbar,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
} from "@/frontend/desktop/components/ui";
import { DesktopBaseDeleteDialog } from "@/frontend/desktop/components/ui/dialog/DesktopBaseDeleteDialog";

export function CronDesktopView({
  labels,
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
  onDeleteClose,
  onDeleteConfirm,
  onTriggerClose,
  onTriggerConfirm,
  onRunsClose,
  onPreviewNextRuns,
}: Readonly<CronViewProps>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          canManage ? (
            <DesktopPrimaryPageAction onClick={onCreateOpen} startIcon={<AddOutlined />}>
              {labels.actionCreate}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />

      {queueStats && !queueStatsLoading ? (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Alert severity="info" sx={{ flex: 1 }}>
            {labels.queueStatsTitle} ({queueStats.backend}): {labels.queueStatsPending} = {queueStats.pending},{" "}
            {labels.queueStatsInFlight} = {queueStats.inFlight}, {labels.queueStatsFailed} = {queueStats.failed}
          </Alert>
        </Stack>
      ) : null}

      {!loading && rows.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {labels.pageSubtitle}
        </Alert>
      ) : null}

      <Box sx={{ height: 600 }}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={row => row.id ?? row.name ?? ""}
          paginationOptions={{ mode: "client" }}
        />
      </Box>

      <DesktopBaseDeleteDialog
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
        open={Boolean(triggering)}
        schedule={triggeringSchedule ?? null}
        labels={labels}
        triggering={triggering}
        onConfirm={onTriggerConfirm}
        onClose={onTriggerClose}
      />

      <DesktopFormErrorSnackbar
        open={notifications.errorOpen}
        message={notifications.errorMsg}
        onClose={notifications.closeError}
      />
      <DesktopFormSuccessSnackbar
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
    </DesktopPageContainer>
  );
}
