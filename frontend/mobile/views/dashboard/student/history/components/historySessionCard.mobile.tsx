"use client";

import { Box, Stack, Typography } from "@mui/material";
import { formatDate, formatTime } from "@/frontend/common/components/intl/dateFormat";
import { classHref } from "@/frontend/common/utils/profileHref";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  formatStudentHistoryDurationStatus,
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { Link } from "@/shared/i18n";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function isSessionJoinable(row: StudentHistorySessionRow): boolean {
  return Boolean(row.meetingJoinUrl) && isJoinableClassInstance(undefined, row.outcome, { isFrozen: row.isFrozen });
}

export interface HistorySessionCardMobileProps {
  readonly row: StudentHistorySessionRow;
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
  readonly onOpenMeetingUrl: StudentHistoryViewModel["onOpenMeetingUrl"];
}

export function HistorySessionCardMobile({
  row,
  labels,
  locale,
  onOpenMeetingUrl,
}: Readonly<HistorySessionCardMobileProps>) {
  const badgeStatus = mapStudentHistoryStatusToBadge(row.status, row.outcome);
  const durationStatus = formatStudentHistoryDurationStatus(row, labels);
  const statusLabel = resolveStudentHistoryStatusLabel(row, labels.statusLabels);

  let dateLabel = "—";
  let timeLabel = "";
  if (row.time) {
    try {
      dateLabel = formatDate(row.time, locale);
      timeLabel = formatTime(row.time, locale);
    } catch {
      dateLabel = row.time;
    }
  }

  const showJoin = isSessionJoinable(row);

  return (
    <MobileCardListItem variant="edge-to-edge" sx={{ py: 2, gap: 1.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            component={Link}
            href={classHref(row.id)}
            variant="bodyMd"
            sx={theme => ({
              color: theme.palette.primary.main,
              fontWeight: 700,
              textDecoration: "none",
              display: "block",
              "&:hover": { textDecoration: "underline" },
            })}
          >
            {row.title}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 0.5 })}>
            {row.instructor?.trim() || "—"}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 0.25 })}>
            {dateLabel}
            {timeLabel ? ` · ${timeLabel}` : ""}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 0.25 })}>
            {durationStatus}
          </Typography>
        </Box>
        <MobileStatusBadge category="classStatus" status={badgeStatus} label={statusLabel} size="small" />
      </Stack>
      {row.notes ? (
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant })}
          noWrap
          title={row.notes}
        >
          {row.notes}
        </Typography>
      ) : null}
      {showJoin ? (
        <Box sx={{ pt: 0.5 }}>
          <MobileMeetingJoinAction
            joinUrl={row.meetingJoinUrl}
            meeting={row.effectiveMeeting}
            onJoinAction={() => onOpenMeetingUrl(row.meetingJoinUrl)}
            label={labels.joinSession}
            emptyRole="class"
          />
        </Box>
      ) : null}
    </MobileCardListItem>
  );
}
