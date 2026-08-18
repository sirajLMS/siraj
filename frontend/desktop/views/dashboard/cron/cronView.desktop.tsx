"use client";

import { AddOutlined } from "@mui/icons-material";
import { Alert, Stack } from "@mui/material";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import { CronDialogsAndNotificationsShared } from "@/frontend/common/views/dashboard/cron/components/__shared__/cronDialogsAndNotificationsShared";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import {
  DesktopAppDataGrid,
  DesktopFormErrorSnackbar,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopBaseDeleteDialog } from "@/frontend/desktop/components/ui/dialog/DesktopBaseDeleteDialog";

function CronQueueStatsBanner({
  labels,
  queueStats,
  queueStatsLoading,
}: Readonly<{
  readonly labels: CronViewProps["labels"];
  readonly queueStats: CronViewProps["queueStats"];
  readonly queueStatsLoading: CronViewProps["queueStatsLoading"];
}>) {
  if (!queueStats || queueStatsLoading) {
    return null;
  }
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <Alert severity="info" sx={{ flex: 1 }}>
        {labels.queueStatsTitle} ({queueStats.backend}): {labels.queueStatsPending} = {queueStats.pending},{" "}
        {labels.queueStatsInFlight} = {queueStats.inFlight}, {labels.queueStatsFailed} = {queueStats.failed}
      </Alert>
    </Stack>
  );
}

function CronEmptyStateBanner({
  labels,
  loading,
  rowsLength,
}: Readonly<{
  readonly labels: CronViewProps["labels"];
  readonly loading: CronViewProps["loading"];
  readonly rowsLength: number;
}>) {
  if (loading || rowsLength > 0) {
    return null;
  }
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      {labels.pageSubtitle}
    </Alert>
  );
}

export function CronDesktopView(props: Readonly<CronViewProps>) {
  const { labels, rows, columns, loading, queueStats, queueStatsLoading, canManage, onCreateOpen } = props;
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

      <CronQueueStatsBanner labels={labels} queueStats={queueStats} queueStatsLoading={queueStatsLoading} />
      <CronEmptyStateBanner labels={labels} loading={loading} rowsLength={rows.length} />

      <DesktopSectionPanel contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={row => row.id ?? row.name ?? ""}
          paginationOptions={{ mode: "client" }}
        />
      </DesktopSectionPanel>

      <CronDialogsAndNotificationsShared
        props={props}
        config={{
          dialogs: { BaseDeleteDialog: DesktopBaseDeleteDialog },
          notifications: {
            FormErrorSnackbar: DesktopFormErrorSnackbar,
            FormSuccessSnackbar: FormSuccessSnackbar,
          },
        }}
      />
    </DesktopPageContainer>
  );
}
