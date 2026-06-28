import {
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  PictureAsPdf,
  School,
  Timer,
  TrendingUp,
  VerifiedUser,
} from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ClassSession, MobileMetricProps, StudentHistoryMobileProps } from "../types";
import { AttendanceStatus } from "../types";
import { ClassSessionList } from "./ClassSessionList";
import { MobileWeeklyScroller } from "./MobileWeeklyScroller";
import { PerformanceStreak } from "./PerformanceStreak";

function deriveStreakDays(
  classes: Readonly<Partial<Record<number, ClassSession>>>,
  currentMonth: Date,
  selectedWeek: number
): number[] {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const weekStartDay = (selectedWeek - 1) * 7 + 1 - firstDayOfMonth;

  const result: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = weekStartDay + i;
    if (day < 1 || day > daysInMonth) {
      result.push(0);
      continue;
    }
    const session = classes[day];
    if (!session) {
      result.push(0);
    } else if (session.status === AttendanceStatus.ABSENT) {
      result.push(0);
    } else if (session.status === AttendanceStatus.LATE) {
      result.push(24);
    } else {
      result.push(48);
    }
  }
  return result;
}

export function StudentHistoryMobile({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  selectedDay,
  onSelectWeek,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrint,
}: Readonly<StudentHistoryMobileProps>) {
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });

  const selectedDaySessions: ClassSession[] = useMemo(() => {
    if (selectedDay === null) return [];
    const session = classes[selectedDay];
    return session ? [session] : [];
  }, [selectedDay, classes]);

  const dateStr = selectedDay !== null ? `Day ${selectedDay} of ${monthStr}` : `${monthStr}`;

  const streakDays = useMemo(
    () => deriveStreakDays(classes, currentMonth, selectedWeek),
    [classes, currentMonth, selectedWeek]
  );

  return (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      <HistoryMobileHeader studentName={studentName} monthStr={monthStr} />

      <HistoryMobileMetricsGrid metrics={metrics} />

      <HistoryMobileActions
        currentMonth={currentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onPrint={onPrint}
      />

      <MobileWeeklyScroller
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        classes={classes}
        onSelectWeek={onSelectWeek}
        onSelectDay={onSelectDay}
      />
      <ClassSessionList dateStr={dateStr} sessions={selectedDaySessions} />
      <PerformanceStreak streakDays={streakDays} />
    </Box>
  );
}

function HistoryMobileHeader({ studentName, monthStr }: Readonly<{ studentName: string; monthStr: string }>) {
  const t = useTranslations("dashboard.studentHistory");
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          color: theme.palette.onSurfaceVariant,
          mb: 1,
        })}
      >
        <Typography variant="labelMd">{t("breadcrumbs.archive")}</Typography>
        <ChevronRight sx={{ fontSize: 16 }} />
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
          })}
        >
          {t("breadcrumbs.history")}
        </Typography>
      </Box>
      <Typography
        variant="titleLg"
        sx={theme => ({
          lineHeight: 1.2,
          color: theme.palette.primary.main,
        })}
      >
        {t("pageTitle", { name: studentName })}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ mt: 0.5, color: theme.palette.onSurfaceVariant })}>
        {t("pageSubtitle", { month: monthStr })}
      </Typography>
    </Box>
  );
}

function HistoryMobileMetricsGrid({
  metrics,
}: Readonly<{ metrics: { totalClasses: number; attendanceRate: number; hoursStudied: number; performance: number } }>) {
  const t = useTranslations("dashboard.studentHistory");
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 1.5,
        mb: 3,
      }}
    >
      <MobileMetric
        title={t("metrics.totalClasses")}
        icon={
          <School
            sx={theme => ({
              color: theme.palette.onPrimaryContainer,
              fontSize: 18,
            })}
          />
        }
        value={metrics.totalClasses}
        bg={theme => theme.palette.primaryContainer}
      />
      <MobileMetric
        title={t("metrics.attendanceRate")}
        icon={
          <VerifiedUser
            sx={theme => ({
              color: theme.palette.onSecondaryContainer,
              fontSize: 18,
            })}
          />
        }
        value={`${metrics.attendanceRate}%`}
        bg={theme => theme.palette.secondaryContainer}
      />
      <MobileMetric
        title={t("metrics.hoursStudied")}
        icon={
          <Timer
            sx={theme => ({
              color: theme.palette.onTertiaryContainer,
              fontSize: 18,
            })}
          />
        }
        value={`${metrics.hoursStudied}h`}
        bg={theme => theme.palette.tertiaryContainer}
      />
      <MobileMetric
        title={t("metrics.performance")}
        icon={
          <TrendingUp
            sx={theme => ({
              color: theme.palette.onErrorContainer,
              fontSize: 18,
            })}
          />
        }
        value={`${metrics.performance}%`}
        bg={theme => theme.palette.errorContainer}
      />
    </Box>
  );
}

function HistoryMobileActions({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onPrint,
}: Readonly<{
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrint: () => void;
}>) {
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" }).toUpperCase();
  const yearStr = currentMonth.getFullYear();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onPrevMonth}
          size="small"
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            borderRadius: 2,
            transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          <ChevronLeft sx={{ fontSize: 18 }} />
        </IconButton>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: theme.palette.primary.main,
            px: 2,
            py: 1,
            borderRadius: 2,
            color: theme.palette.onPrimary,
          })}
        >
          <CalendarToday sx={{ fontSize: 18 }} />
          <Typography variant="buttonText">{`${monthStr} ${yearStr}`}</Typography>
        </Box>
        <IconButton
          onClick={onNextMonth}
          size="small"
          sx={theme => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            borderRadius: 2,
            transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          })}
        >
          <ChevronRight sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Box
        component="button"
        onClick={onPrint}
        sx={theme => ({
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.surfaceContainerHigh,
          borderRadius: 2,
          color: theme.palette.primary.main,
          boxShadow: theme.palette.shadow.button,
          border: "none",
          cursor: "pointer",
        })}
      >
        <PictureAsPdf />
      </Box>
    </Box>
  );
}

function MobileMetric({ title, icon, value, bg }: Readonly<MobileMetricProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLowest,
        p: 2,
        borderRadius: "xl",
        border: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {title}
        </Typography>
        <Box
          sx={theme => ({
            width: 32,
            height: 32,
            borderRadius: "full",
            backgroundColor: typeof bg === "function" ? bg(theme) : bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          {icon}
        </Box>
      </Box>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
        {value}
      </Typography>
    </Box>
  );
}
