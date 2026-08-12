"use client";

import { AddOutlined, DeleteOutlined, TimerOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  TeacherWeeklyScheduleViewShared,
  type TeacherWeeklyScheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/__shared__/teacherWeeklyScheduleViewShared";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import MobileScheduleList from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

type ScheduleLabels = TeacherWeeklyScheduleLabels;
type Schedule = NonNullable<TeacherWeeklyScheduleViewProps["schedule"]>;

function MobileHeaderActions({
  labels,
  hasScheduleCreateClass,
  hasScheduleClearWeekly,
  onAddClass,
  onOpenClearDialog,
}: Readonly<{
  labels: ScheduleLabels;
  hasScheduleCreateClass: boolean;
  hasScheduleClearWeekly: boolean;
  onAddClass: TeacherWeeklyScheduleViewProps["onAddClass"];
  onOpenClearDialog: () => void;
}>) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Stack sx={{ flex: 1 }}>
        {hasScheduleCreateClass ? (
          <MobilePrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass} sx={{ width: "100%", py: 1.5 }}>
            {labels.actions.addSlot}
          </MobilePrimaryPageAction>
        ) : null}
      </Stack>
      {hasScheduleClearWeekly ? (
        <IconButton
          onClick={onOpenClearDialog}
          sx={theme => ({
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            borderRadius: 2,
            px: 4,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          <DeleteOutlined />
        </IconButton>
      ) : null}
    </Stack>
  );
}

function MobileWorkloadMetrics({ labels, schedule }: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
  const workloadMetrics: readonly MetricItem[] = [
    {
      key: "weeklyHoursWorked",
      label: labels.metrics.weeklyHoursWorkedTitle,
      count: schedule.weeklyHoursWorked,
      icon: TimerOutlined,
      labelKey: "weeklyHoursWorked",
      variant: "default",
    },
  ];
  return <MobileMetricCardGrid metrics={workloadMetrics} />;
}

const MOBILE_SLOTS: TeacherWeeklyScheduleViewSharedSlots = {
  PageContainer: MobilePageContainer,
  PageHeader: ({ title, breadcrumbs, actions }) => (
    <MobilePageHeader title={title} breadcrumbs={breadcrumbs} edgeToEdge={false} actions={actions} />
  ),
  HeaderActions: MobileHeaderActions,
  WorkloadMetrics: MobileWorkloadMetrics,
  ScheduleGrid: ({ schedule, onRemoveClass, hasScheduleDeleteClass, labels, meetingJoinLabels }) => (
    <MobileSectionPanel contentInset={false}>
      <MobileScheduleList
        classes={schedule.classes}
        onRemoveClass={onRemoveClass}
        hasScheduleDeleteClass={hasScheduleDeleteClass}
        labels={labels}
        meetingJoinLabels={meetingJoinLabels}
      />
    </MobileSectionPanel>
  ),
};

export function TeacherWeeklyScheduleViewMobile(props: Readonly<TeacherWeeklyScheduleViewProps>) {
  return <TeacherWeeklyScheduleViewShared {...props} slots={MOBILE_SLOTS} />;
}

export default TeacherWeeklyScheduleViewMobile;
