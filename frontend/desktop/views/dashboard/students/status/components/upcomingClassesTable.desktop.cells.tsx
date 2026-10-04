"use client";

import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { useAppLocale } from "@/frontend/common/providers/localeContext";
import {
  formatDateTime,
  formatTime,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/upcomingClassesTableShared";
import type { UpcomingClassDisplay } from "@/frontend/common/views/dashboard/students/status/types";
import type { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type StudentStatusLabels = ReturnType<typeof useStudentStatusLabels>;
type AppLocale = ReturnType<typeof useAppLocale>;

interface ScheduleCellContentProps {
  readonly locale: AppLocale;
  readonly row: UpcomingClassDisplay;
}

export function ScheduleCellContent({ locale, row }: Readonly<ScheduleCellContentProps>) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
        {formatDateTime(locale, row.scheduledStartAt)}
      </Typography>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {`${formatTime(locale, row.scheduledStartAt)} - ${formatTime(locale, row.scheduledEndAt)}`}
      </Typography>
    </Box>
  );
}

export function JoinCellContent({
  t,
  row,
}: Readonly<{ readonly t: StudentStatusLabels; readonly row: UpcomingClassDisplay }>) {
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen }) ? (
    <DesktopMeetingJoinAction
      variant="icon"
      joinUrl={row.meetingJoinUrl}
      meeting={row.effectiveMeeting}
      emptyRole="parent"
      label={t.table.joinSession}
    />
  ) : (
    <Tooltip title={t.table.sessionEnded}>
      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
        <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
      </Box>
    </Tooltip>
  );
}
