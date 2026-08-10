"use client";

import { Box, Button, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  formatClassSchedule,
  isRowJoinable,
  type TeacherClassListViewModel,
} from "@/frontend/common/views/dashboard/teachers/classes/useTeacherClassListViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { ClassSessionActionButtonMobile } from "@/frontend/mobile/views/dashboard/schedule/alerts/components/classSessionActionButton.mobile";

type TeacherClassRow = TeacherClassListViewModel["rows"][number];

function ClassCard({
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
    <MobileCardListItem>
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
        {isRowJoinable(row) ? (
          <MobileMeetingJoinAction
            variant="icon"
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            emptyRole="teacher"
            label={labels.joinVideo}
            setupHref="/profile?tab=meeting"
          />
        ) : (
          <ClassSessionActionButtonMobile
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
    </MobileCardListItem>
  );
}

/**
 * Mobile variant of the Teacher Class List view. Uses `MobileCardList` +
 * edge-to-edge `MobileCardListItem` rows, with the tier-specific
 * `ClassSessionActionButtonMobile` and the shared `ScheduleInstanceStatusBadge`
 * + `MeetingJoinAction` primitives.
 */
export function TeacherClassListMobileView({
  rows,
  loading,
  error,
  labels,
  locale,
  handleViewClassAudit,
}: Readonly<TeacherClassListViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : null}
      {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{labels.failedToLoad}</Typography> : null}
      {!loading && !error ? (
        <MobileCardList
          rows={rows}
          getKey={row => row.id ?? row.studentName ?? ""}
          renderItem={row => (
            <ClassCard row={row} labels={labels} locale={locale} handleViewClassAudit={handleViewClassAudit} />
          )}
          emptyMessage={labels.noClasses}
          paginationOptions={{ mode: "client" }}
        />
      ) : null}
    </MobilePageContainer>
  );
}
