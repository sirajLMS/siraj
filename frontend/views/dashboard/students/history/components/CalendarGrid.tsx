import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Paper, styled, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/frontend/components/ui";
import { AttendanceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { Link } from "@/shared/i18n/routing";
import type { CalendarGridProps, ClassSession } from "../types";

const calendarCellBase = ({ theme }: { theme: import("@mui/material/styles").Theme }) => ({
  borderRight: `1px solid ${theme.palette.border.light}`,
  borderBottom: `1px solid ${theme.palette.border.light}`,
  padding: theme.spacing(1.5),
  transition: "all 0.2s ease-in-out",
  backgroundColor: theme.palette.background.paper,
  position: "relative" as const,
});

const CalendarCell = styled(Box)(({ theme }) => ({
  ...calendarCellBase({ theme }),
  cursor: "default",
}));

const CalendarCellLink = styled(Link)(({ theme }) => ({
  ...calendarCellBase({ theme }),
  display: "block",
  textDecoration: "none",
  color: "inherit",
  cursor: "pointer",
  "&:hover": {
    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
  },
}));

const EmptyCell = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRight: `1px solid ${theme.palette.border.light}`,
  borderBottom: `1px solid ${theme.palette.border.light}`,
  padding: theme.spacing(1.5),
  opacity: 0.3,
}));

function CalendarStatusBadge({ status, label }: Readonly<{ status: AttendanceStatus; label: string }>) {
  let badgeStatus: string;
  if (status === AttendanceStatus.Present) {
    badgeStatus = "active";
  } else if (status === AttendanceStatus.Late) {
    badgeStatus = "late";
  } else if (status === AttendanceStatus.Absent) {
    badgeStatus = "blocked";
  } else {
    badgeStatus = "pending";
  }
  return <StatusBadge category="classSession" status={badgeStatus} label={label} />;
}

function CalendarDayCell({ day, session }: Readonly<{ day: number; session?: ClassSession }>) {
  const content = (
    <>
      <Typography
        variant="labelMd"
        sx={{
          color: theme => theme.palette.onSurfaceVariant,
          transition: "colors 0.2s",
          ...(session && { "&:hover": { color: theme => theme.palette.primary.main } }),
        }}
      >
        {day}
      </Typography>

      {session && (
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <CalendarStatusBadge status={session.status} label={session.title} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: theme => theme.palette.onSurfaceVariant,
            }}
          >
            <ScheduleOutlined sx={{ fontSize: 10 }} />
            <Typography sx={{ typography: "labelSm" }}>{session.time}</Typography>
          </Box>
        </Box>
      )}
    </>
  );

  if (session) {
    return <CalendarCellLink href={`/classes/${session.id}`}>{content}</CalendarCellLink>;
  }

  return <CalendarCell>{content}</CalendarCell>;
}

export function CalendarGrid({ currentMonth, classes }: Readonly<CalendarGridProps>) {
  const t = useTranslations("dashboard.studentHistory.calendar.days");
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

  const emptyStartDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    return prevMonthDays - firstDayOfMonth + i + 1;
  });

  const remainingCells = 35 - (emptyStartDays.length + daysInMonth);
  const emptyEndDays = Array.from(
    { length: remainingCells > 0 ? remainingCells : remainingCells + 7 },
    (_, i) => i + 1
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: theme => theme.layout.radius.card,
        border: theme => `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: theme => `1px solid ${theme.palette.border.light}`,
          backgroundColor: theme => theme.palette.surfaceContainerLow,
        }}
      >
        {daysOfWeek.map(day => (
          <Box key={day} sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="buttonText" sx={{ color: theme => theme.palette.onSecondaryContainer }}>
              {t(day)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: 800 }}>
        {emptyStartDays.map(day => (
          <EmptyCell key={`start-${day}`}>
            <Typography variant="labelMd">{day}</Typography>
          </EmptyCell>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <CalendarDayCell key={day} day={day} session={classes[day]} />
        ))}

        {emptyEndDays.map(day => (
          <EmptyCell key={`end-${day}`}>
            <Typography variant="labelMd">{day}</Typography>
          </EmptyCell>
        ))}
      </Box>
    </Paper>
  );
}
