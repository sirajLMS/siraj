"use client";

import { Box, Link, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { LoadingState } from "@/frontend/common/components/ui";
import { PrimaryPageAction } from "@/frontend/common/components/ui/button";
import type { MeetingJoinActionProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  formatClassSchedule,
  isRowJoinable,
  type TeacherClassListViewModel,
} from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";

type TeacherClassRow = TeacherClassListViewModel["rows"][number];

interface ClassSessionActionLabels {
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
}

interface ClassSessionActionButtonSlotProps {
  readonly action: "view_class_audit";
  readonly classId: string;
  readonly labels: ClassSessionActionLabels;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly fullWidth?: boolean;
}

export interface TeacherClassListViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<{ readonly title: string; readonly subtitle?: string }>;
  readonly RowWrapper: ComponentType<{ readonly children: ReactNode }>;
  readonly ListContainer: ComponentType<{
    readonly children: ReactNode;
  }>;
  readonly MeetingJoinAction: ComponentType<Readonly<MeetingJoinActionProps>>;
  readonly ClassSessionActionButton: ComponentType<Readonly<ClassSessionActionButtonSlotProps>>;
}

export interface TeacherClassListViewSharedOptions {
  readonly actionButtonMarginTop: number;
}

export type TeacherClassListViewSharedProps = Readonly<TeacherClassListViewModel> & {
  readonly slots: TeacherClassListViewSharedSlots;
  readonly options: TeacherClassListViewSharedOptions;
};

function ClassRow({
  row,
  labels,
  locale,
  handleViewClassAudit,
  slots,
  options,
}: Readonly<{
  row: TeacherClassRow;
  labels: TeacherClassListViewModel["labels"];
  locale: string;
  handleViewClassAudit: (id: string) => void;
  slots: TeacherClassListViewSharedSlots;
  options: TeacherClassListViewSharedOptions;
}>) {
  const classId = row.id ?? "";
  return (
    <slots.RowWrapper>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.studentName}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {formatClassSchedule(row.scheduledStartAt, row.scheduledEndAt, locale)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
          {row.durationMinutes ? (
            <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
              {labels.durationMinutes(row.durationMinutes)}
            </Typography>
          ) : null}
          <ScheduleInstanceStatusBadge
            executionState={row.executionState}
            outcome={row.outcome}
            scheduledStartAt={row.scheduledStartAt}
            scheduledEndAt={row.scheduledEndAt}
            durationMinutes={row.durationMinutes}
            statusLabels={labels.statusLabels}
            size="small"
          />
        </Stack>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: options.actionButtonMarginTop, flexWrap: "wrap" }}>
        {isRowJoinable(row) ? (
          <slots.MeetingJoinAction
            variant="icon"
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            emptyRole="teacher"
            label={labels.joinVideo}
            setupHref="/profile?tab=meeting"
          />
        ) : (
          <slots.ClassSessionActionButton
            action="view_class_audit"
            classId={classId}
            labels={{
              joinSession: "",
              leaveClass: "",
              leaveDisabledReason: "",
              viewClassAudit: labels.viewClassAudit,
              contactAdmin: "",
            }}
            onLeave={() => {}}
            onViewClassAudit={handleViewClassAudit}
          />
        )}
        <Link href={`/classes/${classId}`} style={{ textDecoration: "none" }}>
          <PrimaryPageAction size="small">{labels.viewDetails}</PrimaryPageAction>
        </Link>
      </Box>
    </slots.RowWrapper>
  );
}

export function TeacherClassListViewShared({
  rows,
  loading,
  error,
  labels,
  locale,
  handleViewClassAudit,
  slots,
  options,
}: TeacherClassListViewSharedProps) {
  return (
    <slots.PageContainer>
      <slots.PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? <LoadingState /> : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? (
        <slots.ListContainer>
          {rows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noClasses}</Typography>
          ) : (
            rows.map(row => (
              <ClassRow
                key={row.id ?? row.studentName ?? ""}
                row={row}
                labels={labels}
                locale={locale}
                handleViewClassAudit={handleViewClassAudit}
                slots={slots}
                options={options}
              />
            ))
          )}
        </slots.ListContainer>
      ) : null}
    </slots.PageContainer>
  );
}
