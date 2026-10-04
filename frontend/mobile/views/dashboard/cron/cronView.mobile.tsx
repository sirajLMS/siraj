"use client";

import { AddOutlined } from "@mui/icons-material";
import type { ReactNode } from "react";
import { FormSuccessSnackbar } from "@/frontend/common/components/ui/form/snackbar/FormSuccessSnackbar";
import type { CronScheduleFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { CronDialogsAndNotificationsShared } from "@/frontend/common/views/dashboard/cron/components/__shared__/cronDialogsAndNotificationsShared";
import type { CronViewProps } from "@/frontend/common/views/dashboard/cron/types";
import {
  MobileBaseDeleteDialog,
  MobileCardList,
  MobileFab,
  MobileFormErrorSnackbar,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { CronMobileQueueAlerts, MobileScheduleRow } from "@/frontend/mobile/views/dashboard/cron/cronView.mobile.parts";

export function CronMobileView(props: Readonly<CronViewProps>) {
  const {
    labels,
    rows,
    loading,
    queueStats,
    queueStatsLoading,
    canManage,
    onCreateOpen,
    onDeleteRow,
    onEditRow,
    onPauseRow,
    onResumeRow,
    onTriggerRow,
    onRunsOpen,
  } = props;

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

      <CronDialogsAndNotificationsShared
        props={props}
        config={{
          dialogs: { BaseDeleteDialog: MobileBaseDeleteDialog },
          notifications: {
            FormErrorSnackbar: MobileFormErrorSnackbar,
            FormSuccessSnackbar: FormSuccessSnackbar,
          },
        }}
      />

      {canManage ? <MobileFab icon={<AddOutlined />} label={labels.actionCreate} onClick={onCreateOpen} /> : null}
    </MobilePageContainer>
  );
}
