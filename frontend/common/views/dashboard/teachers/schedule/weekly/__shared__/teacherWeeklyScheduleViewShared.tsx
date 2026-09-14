"use client";

import { Typography } from "@mui/material";
import type { FC, ReactNode } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";

type ScheduleLabels = NonNullable<TeacherWeeklyScheduleViewProps["labels"]>;
type Schedule = NonNullable<TeacherWeeklyScheduleViewProps["schedule"]>;

export interface TeacherWeeklyScheduleViewSharedSlots {
  readonly PageContainer: FC<Readonly<{ children: ReactNode }>>;
  readonly PageHeader: FC<
    Readonly<{
      title: string;
      breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
      actions?: ReactNode;
    }>
  >;
  readonly HeaderActions: FC<
    Readonly<{
      labels: ScheduleLabels;
      hasScheduleCreateClass: boolean;
      hasScheduleClearWeekly: boolean;
      onAddClass: TeacherWeeklyScheduleViewProps["onAddClass"];
      onOpenClearDialog: () => void;
    }>
  >;
  readonly WorkloadMetrics: FC<Readonly<{ labels: ScheduleLabels; schedule: Schedule }>>;
  readonly ScheduleGrid: FC<
    Readonly<{
      schedule: Schedule;
      onRemoveClass: TeacherWeeklyScheduleViewProps["onRemoveClass"];
      hasScheduleDeleteClass: boolean;
      labels: ScheduleLabels;
      meetingJoinLabels: TeacherWeeklyScheduleViewProps["meetingJoinLabels"];
      selectedDay: string;
      onSelectDay: (day: string) => void;
    }>
  >;
  readonly LegendBar?: FC<Readonly<{ labels: ScheduleLabels; schedule: Schedule }>>;
}

export function ClearScheduleDialogShared({
  labels,
  open,
  onCancel,
  onConfirm,
  isLoading = false,
}: Readonly<{
  labels: ScheduleLabels;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={labels.dialogs.clearScheduleTitle}
      body={labels.dialogs.clearScheduleMessage}
      cancelLabel={labels.dialogs.cancel}
      confirmLabel={labels.actions.clearSchedule}
    />
  );
}

export function TeacherWeeklyScheduleViewShared({
  schedule,
  onRemoveClass,
  onClearSchedule,
  onAddClass,
  hasScheduleCreateClass,
  hasScheduleClearWeekly,
  hasScheduleViewWorkload,
  hasScheduleDeleteClass,
  labels,
  meetingJoinLabels,
  selectedDay,
  onSelectDay,
  slots,
}: Readonly<TeacherWeeklyScheduleViewProps> & {
  readonly slots: TeacherWeeklyScheduleViewSharedSlots;
}) {
  const t = labels;
  const { PageContainer, PageHeader, HeaderActions, WorkloadMetrics, ScheduleGrid, LegendBar } = slots;
  const clearDialogOpen = useWeeklyScheduleStore(state => state.clearDialogOpen);
  const setClearDialogOpen = useWeeklyScheduleStore(state => state.setClearDialogOpen);

  if (!schedule) return null;

  const handleConfirmClear = () => {
    setClearDialogOpen(false);
    onClearSchedule?.();
  };

  const handleCancelClear = () => {
    setClearDialogOpen(false);
  };

  const breadcrumbs = [{ label: t.breadcrumbs.teachers, href: "/teachers" }, { label: t.breadcrumbs.schedule }];

  return (
    <PageContainer>
      <PageHeader
        title={t.pageTitle(schedule.teacherName)}
        breadcrumbs={breadcrumbs}
        actions={
          <HeaderActions
            labels={t}
            hasScheduleCreateClass={hasScheduleCreateClass}
            hasScheduleClearWeekly={hasScheduleClearWeekly}
            onAddClass={onAddClass}
            onOpenClearDialog={() => setClearDialogOpen(true)}
          />
        }
      />

      {hasScheduleViewWorkload ? <WorkloadMetrics labels={t} schedule={schedule} /> : null}

      <ScheduleGrid
        schedule={schedule}
        onRemoveClass={onRemoveClass}
        hasScheduleDeleteClass={hasScheduleDeleteClass}
        labels={labels}
        meetingJoinLabels={meetingJoinLabels}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
      />

      {LegendBar ? <LegendBar labels={t} schedule={schedule} /> : null}

      <ClearScheduleDialogShared
        labels={t}
        open={clearDialogOpen}
        onCancel={handleCancelClear}
        onConfirm={handleConfirmClear}
      />
    </PageContainer>
  );
}

export function ScheduleLastUpdatedShared({
  labels,
  schedule,
}: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
  return (
    <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
      {labels.grid.lastUpdated(schedule.lastUpdated)}
    </Typography>
  );
}
