"use client";

import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { type ClassSession, isJoinableClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import {
  attendanceBadgeStatus,
  splitSessionTimeDisplay,
} from "@/frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile.helpers";
import { Link } from "@/shared/i18n";

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
        <Link href={`/classes/${session.id}`} style={{ textDecoration: "none" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
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
              <MobileStatusBadge
                category="classSession"
                status={attendanceBadgeStatus(session.status)}
                label={statusLabel}
              />
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {durationLabel}
              </Typography>
            </Box>
          </Box>
        </Link>
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

export { ClassSessionCard, SessionListHeader };
