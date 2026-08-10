"use client";

import type { Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { AttendanceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { ClassSession, ClassSessionListProps } from "@/frontend/common/views/dashboard/students/history/types";
import { isJoinableClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { MobileCardList, MobileCardListItem } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { Link } from "@/shared/i18n";

const STATUS_LABEL_KEYS: Readonly<Record<AttendanceStatus, string>> = {
  [AttendanceStatus.Absent]: "absent",
  [AttendanceStatus.Late]: "late",
  [AttendanceStatus.Present]: "present",
};

function getStatusLabel(status: AttendanceStatus, labels: Readonly<Record<string, string>>): string {
  const key = STATUS_LABEL_KEYS[status];
  return labels[key] ?? labels[status] ?? status;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hrs = mins / 60;
  return `${hrs % 1 === 0 ? hrs : hrs.toFixed(1)}h`;
}

function SessionListHeader({ title, dateStr }: Readonly<{ title: string; dateStr: string }>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
        {title}
      </Typography>
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: theme.palette.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        })}
      >
        {dateStr}
      </Typography>
    </Box>
  );
}

function getStatusColors(status: AttendanceStatus, theme: Theme): { backgroundColor: string; color: string } {
  if (status === AttendanceStatus.Present) {
    return {
      backgroundColor: theme.palette.status.activeContainer,
      color: theme.palette.status.onActiveContainer,
    };
  }
  if (status === AttendanceStatus.Absent) {
    return {
      backgroundColor: theme.palette.errorContainer,
      color: theme.palette.onErrorContainer,
    };
  }
  if (status === AttendanceStatus.Late) {
    return {
      backgroundColor: theme.palette.warningContainer ?? theme.palette.tertiaryContainer,
      color: theme.palette.onWarningContainer ?? theme.palette.onTertiaryContainer,
    };
  }
  return {
    backgroundColor: theme.palette.secondaryContainer,
    color: theme.palette.onSecondaryContainer,
  };
}

function splitSessionTimeDisplay(time: string, locale: string): { timeValue: string; timePeriod: string } {
  if (!time.trim()) {
    return { timeValue: "—", timePeriod: "" };
  }

  const formatted = formatTime(time, locale);
  const spaceIndex = formatted.indexOf(" ");
  if (spaceIndex === -1) {
    return { timeValue: formatted, timePeriod: "" };
  }

  return {
    timeValue: formatted.slice(0, spaceIndex),
    timePeriod: formatted.slice(spaceIndex + 1).trim(),
  };
}

function ClassSessionCard({
  session,
  statusLabel,
  durationLabel,
}: Readonly<{
  session: ClassSession;
  statusLabel: string;
  durationLabel: string;
}>) {
  const t = useStudentHistoryLabels().classDetails;
  const locale = useAppLocale();
  const { timeValue, timePeriod } = splitSessionTimeDisplay(session.time, locale);
  const showJoin = isJoinableClassSession(session.executionState, session.outcome, { isFrozen: session.isFrozen });

  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          component={Link}
          href={`/classes/${session.id}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexGrow: 1,
            textDecoration: "none",
            color: "inherit",
            "&:hover": { transform: "translateX(4px)" },
            cursor: "pointer",
          }}
        >
          <Box
            sx={theme => ({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              p: 1,
              borderRadius: "lg",
              width: 64,
              height: 64,
              flexShrink: 0,
            })}
          >
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {timeValue}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {timePeriod}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.onSurface })}>
              {session.title}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {session.notes}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
            <Box
              sx={theme => ({
                ...getStatusColors(session.status, theme),
                px: 1,
                py: 0.25,
                borderRadius: 1,
                typography: "labelSm",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              {statusLabel}
            </Box>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {durationLabel}
            </Typography>
          </Box>
        </Box>
        {showJoin ? (
          <MobileMeetingJoinAction
            variant="icon"
            joinUrl={session.meetingJoinUrl}
            meeting={session.effectiveMeeting}
            emptyRole="parent"
            label={t.joinSession}
          />
        ) : null}
      </Box>
    </MobileCardListItem>
  );
}

export function ClassSessionListMobile({ dateStr, sessions }: Readonly<ClassSessionListProps>) {
  const t = useStudentHistoryLabels().classDetails;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SessionListHeader title={t.title} dateStr={dateStr} />

      <MobileCardList
        rows={sessions}
        emptyMessage={t.noSessions}
        getKey={session => session.id}
        paginationOptions={false}
        layout="edge-to-edge"
        renderItem={session => (
          <ClassSessionCard
            session={session}
            statusLabel={getStatusLabel(session.status, t.status)}
            durationLabel={formatDuration(session.duration)}
          />
        )}
      />
    </Box>
  );
}
