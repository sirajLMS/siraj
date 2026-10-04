import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Button, type SxProps, type Theme, Typography } from "@mui/material";
import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { classHref } from "@/frontend/common/utils/profileHref";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import {
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { Link } from "@/shared/i18n";

const SPILLOVER_CELL_SX: SxProps<Theme> = (theme: Theme) => ({
  minHeight: 88,
  p: 1.5,
  opacity: 0.35,
  borderRight: `1px solid ${theme.palette.outlineVariant}`,
  borderBottom: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surface,
});

function formatSessionTime(time: string, locale: string): string {
  if (!time) return "—";
  try {
    return formatTime(time, locale);
  } catch {
    return time;
  }
}

export function CalendarWeekdayHeader({ weekdayLabels }: { readonly weekdayLabels: readonly string[] }) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainer,
      })}
    >
      {weekdayLabels.map(label => (
        <Box key={label} sx={{ p: 1, textAlign: "center" }}>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700 })}>
            {label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export function CalendarSpilloverDay({ day }: { readonly day: number }) {
  return (
    <Box sx={SPILLOVER_CELL_SX}>
      <Typography variant="labelMd">{day}</Typography>
    </Box>
  );
}

interface CalendarDayCellProps {
  readonly day: number;
  readonly session: StudentHistorySessionRow | undefined;
  readonly isSelected: boolean;
  readonly onSelectDay: (day: number | null) => void;
  readonly labels: StudentHistoryViewModel["labels"];
  readonly locale: string;
}

export function CalendarDayCell({
  day,
  session,
  isSelected,
  onSelectDay,
  labels,
  locale,
}: Readonly<CalendarDayCellProps>) {
  const statusLabel = session ? resolveStudentHistoryStatusLabel(session, labels.statusLabels) : "";
  const badgeStatus = session ? mapStudentHistoryStatusToBadge(session.status, session.outcome) : "pending";

  return (
    <Button
      type="button"
      onClick={() => onSelectDay(isSelected ? null : day)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectDay(isSelected ? null : day);
        }
      }}
      sx={theme => ({
        minHeight: 88,
        p: 1.5,
        cursor: "pointer",
        borderRight: `1px solid ${theme.palette.outlineVariant}`,
        borderBottom: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLowest,
        transition: theme.transitions.create("background-color", { duration: 150, easing: "ease" }),
        textTransform: "none",
        "&:hover": {
          boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
          backgroundColor: isSelected ? theme.palette.primaryContainer : theme.palette.surfaceContainerLowest,
        },
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: isSelected ? theme.palette.onPrimaryContainer : theme.palette.onSurfaceVariant,
          fontWeight: isSelected ? 700 : 500,
        })}
      >
        {day}
      </Typography>
      {session ? (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Link href={classHref(session.id)} style={{ textDecoration: "none" }} onClick={e => e.stopPropagation()}>
            <Typography
              variant="labelMd"
              sx={theme => ({
                color: theme.palette.primary.main,
                fontWeight: 700,
                textDecoration: "none",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                "&:hover": { textDecoration: "underline" },
              })}
            >
              {session.title}
            </Typography>
          </Link>
          <DesktopStatusBadge category="classStatus" status={badgeStatus} label={statusLabel} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ScheduleOutlined sx={theme => ({ fontSize: 12, color: theme.palette.onSurfaceVariant })} />
            <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {formatSessionTime(session.time, locale)}
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Button>
  );
}
