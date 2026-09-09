"use client";

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
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useMemo } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryLabelsProvider } from "@/frontend/common/views/dashboard/students/history/studentHistoryLabelsContext";
import type { ClassSession, MobileMetricProps } from "@/frontend/common/views/dashboard/students/history/types";
import { useStudentHistoryLabels } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryLabels";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page";
import { ClassSessionListMobile } from "@/frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile";
import { MobileWeeklyScroller } from "@/frontend/mobile/views/dashboard/students/history/components/mobileWeeklyScroller.mobile";
import { PerformanceStreakMobile } from "@/frontend/mobile/views/dashboard/students/history/components/performanceStreak.mobile";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

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

function HistoryMobileHeader({ studentName, monthStr }: Readonly<{ studentName: string; monthStr: string }>) {
  const t = useStudentHistoryLabels();
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
        <Typography variant="labelMd">{t.breadcrumbs.archive}</Typography>
        <ChevronRight
          sx={{
            fontSize: 16,
            transform: theme => (theme.direction === "rtl" ? "scaleX(-1)" : undefined),
          }}
        />
        <Typography
          variant="labelMd"
          sx={theme => ({
            fontWeight: 700,
            color: theme.palette.primary.main,
          })}
        >
          {t.breadcrumbs.history}
        </Typography>
      </Box>
      <Typography
        variant="titleLg"
        sx={theme => ({
          lineHeight: 1.2,
          color: theme.palette.primary.main,
        })}
      >
        {t.pageTitle(studentName)}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ mt: 0.5, color: theme.palette.onSurfaceVariant })}>
        {t.pageSubtitle(monthStr)}
      </Typography>
    </Box>
  );
}

function HistoryMobileMetricsGrid({
  metrics,
}: Readonly<{ metrics: { totalClasses: number; attendanceRate: number; hoursStudied: number; performance: number } }>) {
  const t = useStudentHistoryLabels();
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
        title={t.metrics.totalClasses(metrics.totalClasses)}
        icon={<School sx={theme => ({ color: theme.palette.onPrimaryContainer, fontSize: 18 })} />}
        value={metrics.totalClasses}
        bg={theme => theme.palette.primaryContainer}
      />
      <MobileMetric
        title={t.metrics.attendanceRate(metrics.attendanceRate)}
        icon={<VerifiedUser sx={theme => ({ color: theme.palette.onSecondaryContainer, fontSize: 18 })} />}
        value={t.percentValue(metrics.attendanceRate)}
        bg={theme => theme.palette.secondaryContainer}
      />
      <MobileMetric
        title={t.metrics.hoursStudied(metrics.hoursStudied)}
        icon={<Timer sx={theme => ({ color: theme.palette.onTertiaryContainer, fontSize: 18 })} />}
        value={t.hoursShort(metrics.hoursStudied)}
        bg={theme => theme.palette.tertiaryContainer}
      />
      <MobileMetric
        title={t.metrics.performance(metrics.performance)}
        icon={<TrendingUp sx={theme => ({ color: theme.palette.onErrorContainer, fontSize: 18 })} />}
        value={t.percentValue(metrics.performance)}
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
  canGoPrev,
  canGoNext,
}: Readonly<{
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onPrint: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}>) {
  const t = useStudentHistoryLabels();
  const locale = useAppLocale();
  const monthStr = currentMonth.toLocaleString(getLatnLocaleTag(locale), { month: "long" }).toUpperCase();
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
        <Tooltip title={t.previousMonth}>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={onPrevMonth}
              size="small"
              disabled={!canGoPrev}
              aria-label={t.previousMonth}
              sx={theme => ({
                backgroundColor: canGoPrev ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                color: canGoPrev ? theme.palette.onPrimary : theme.palette.action.disabled,
                borderRadius: 2,
                transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
                "&:hover": {
                  backgroundColor: canGoPrev ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
                },
              })}
            >
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Tooltip>
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
        <Tooltip title={t.nextMonth}>
          <Box component="span" sx={{ display: "inline-flex" }}>
            <IconButton
              onClick={onNextMonth}
              size="small"
              disabled={!canGoNext}
              aria-label={t.nextMonth}
              sx={theme => ({
                backgroundColor: canGoNext ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                color: canGoNext ? theme.palette.onPrimary : theme.palette.action.disabled,
                borderRadius: 2,
                transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
                "&:hover": {
                  backgroundColor: canGoNext ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
                },
              })}
            >
              <ChevronRight sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
      <Tooltip title={t.exportPdf}>
        <IconButton
          type="button"
          aria-label={t.exportPdf}
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
            "&:hover": {
              backgroundColor: theme.palette.surfaceContainerHigh,
            },
          })}
        >
          <PictureAsPdf />
        </IconButton>
      </Tooltip>
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

export function StudentHistoryMobileView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  selectedDay,
  embedded = false,
  onSelectWeek,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrint,
  enrollmentMonth,
  nowMonth,
  locale,
  labels,
}: Readonly<StudentHistoryViewModel>) {
  const { canView } = useStudentFieldAccess();
  const monthStr = currentMonth.toLocaleString(getLatnLocaleTag(locale), { month: "long" });

  const selectedDaySessions: ClassSession[] = useMemo(() => {
    if (selectedDay === null) return [];
    const session = classes[selectedDay];
    return session ? [session] : [];
  }, [selectedDay, classes]);

  const dateStr = selectedDay === null ? monthStr : labels.classDetails.dayOfMonth(selectedDay, monthStr);

  const streakDays = useMemo(
    () => deriveStreakDays(classes, currentMonth, selectedWeek),
    [classes, currentMonth, selectedWeek]
  );

  const canGoPrev = !enrollmentMonth || currentMonth > enrollmentMonth;
  const canGoNext = !nowMonth || currentMonth < nowMonth;

  if (!canView("student_history")) {
    const restricted = <ProfileRestrictedSection title={labels.pageTitle("{name}")} />;
    return embedded ? restricted : <MobilePageContainer>{restricted}</MobilePageContainer>;
  }

  const body = (
    <>
      <HistoryMobileHeader studentName={studentName} monthStr={monthStr} />
      <HistoryMobileMetricsGrid metrics={metrics} />
      <HistoryMobileActions
        currentMonth={currentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onPrint={onPrint}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />
      <MobileWeeklyScroller
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        classes={classes}
        onSelectWeek={onSelectWeek}
        onSelectDay={onSelectDay}
      />
      <ClassSessionListMobile dateStr={dateStr} sessions={selectedDaySessions} />
      <PerformanceStreakMobile streakDays={streakDays} />
    </>
  );

  if (embedded) {
    return <StudentHistoryLabelsProvider labels={labels}>{body}</StudentHistoryLabelsProvider>;
  }

  return (
    <StudentHistoryLabelsProvider labels={labels}>
      <MobilePageContainer>{body}</MobilePageContainer>
    </StudentHistoryLabelsProvider>
  );
}
