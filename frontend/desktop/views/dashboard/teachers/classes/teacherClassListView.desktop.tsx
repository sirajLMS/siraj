"use client";

import { Box, Button, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  formatClassSchedule,
  isRowJoinable,
  type TeacherClassListViewModel,
} from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { ClassSessionActionButtonDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/classSessionActionButton.desktop";

type TeacherClassRow = TeacherClassListViewModel["rows"][number];

function ClassRow({
  row,
  labels,
  locale,
  handleViewClassAudit,
}: {
  readonly row: TeacherClassRow;
  readonly labels: TeacherClassListViewModel["labels"];
  readonly locale: string;
  readonly handleViewClassAudit: (id: string) => void;
}) {
  const classId = row.id ?? "";
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      })}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>{row.studentName}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {formatClassSchedule(row.scheduledStartAt, row.scheduledEndAt, locale)}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mt: 0.5 }}>
          {row.durationMinutes ? (
            <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isRowJoinable(row) ? (
          <DesktopMeetingJoinAction
            variant="icon"
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            emptyRole="teacher"
            label={labels.joinVideo}
            setupHref="/profile?tab=meeting"
          />
        ) : (
          <ClassSessionActionButtonDesktop
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
        <Button component={Link} href={`/classes/${classId}`} variant="outlined" size="small">
          {labels.viewDetails}
        </Button>
      </Box>
    </Box>
  );
}

/**
 * Desktop variant of the Teacher Class List view. Renders a vertical `Stack`
 * of outlined row `Box`es mirroring the original container layout, using the
 * tier-specific `ClassSessionActionButtonDesktop` plus the shared
 * `ScheduleInstanceStatusBadge` + `MeetingJoinAction` primitives.
 */
export function TeacherClassListDesktopView({
  rows,
  loading,
  error,
  labels,
  locale,
  handleViewClassAudit,
}: Readonly<TeacherClassListViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? (
        <Stack spacing={1}>
          {rows.length === 0 ? (
            <Typography sx={{ color: theme => theme.palette.text.secondary }}>{labels.noClasses}</Typography>
          ) : (
            rows.map(row => (
              <ClassRow
                key={row.id ?? String(row.studentName ?? "")}
                row={row}
                labels={labels}
                locale={locale}
                handleViewClassAudit={handleViewClassAudit}
              />
            ))
          )}
        </Stack>
      ) : null}
    </DesktopPageContainer>
  );
}
