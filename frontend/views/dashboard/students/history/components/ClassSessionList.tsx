import type { Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { AttendanceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { Link } from "@/shared/i18n/routing";
import type { ClassSession, ClassSessionListProps } from "../types";

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

function ClassSessionCard({
  session,
  statusLabel,
  durationLabel,
}: Readonly<{ session: ClassSession; statusLabel: string; durationLabel: string }>) {
  const [timeValue, timePeriod] = session.time.split(" ");

  return (
    <Box
      component={Link}
      href={`/classes/${session.id}`}
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        borderRadius: "xl",
        boxShadow: theme.palette.shadow.card,
        border: `1px solid ${theme.palette.border.light}`,
        p: theme.spacing(2),
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "transform 0.2s",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { transform: "translateX(4px)" },
        cursor: "pointer",
      })}
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
  );
}

export function ClassSessionList({ dateStr, sessions }: Readonly<ClassSessionListProps>) {
  const t = useTranslations("dashboard.studentHistory.classDetails");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <SessionListHeader title={t("title")} dateStr={dateStr} />

      {sessions.length === 0 ? (
        <Typography
          variant="bodyMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, textAlign: "center", py: 4 })}
        >
          {t("noSessions")}
        </Typography>
      ) : (
        sessions.map(session => (
          <ClassSessionCard
            key={session.id}
            session={session}
            statusLabel={t(`status.${session.status}`)}
            durationLabel={formatDuration(session.duration)}
          />
        ))
      )}
    </Box>
  );
}
