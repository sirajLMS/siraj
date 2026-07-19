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
import { Box, IconButton, Typography } from "@mui/material";
import { ExportButton } from "@/frontend/common/components/ui/button";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { CalendarGridDesktop } from "@/frontend/desktop/views/dashboard/students/history/components/calendarGrid.desktop";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppTranslation } from "@/shared/locale";

export function StudentHistoryDesktopView({
  studentName,
  currentMonth,
  metrics,
  classes,
  embedded = false,
  onPrevMonth,
  onNextMonth,
  onPrint,
  enrollmentMonth,
  nowMonth,
  locale,
}: Readonly<StudentHistoryViewModel>) {
  const t = useAppTranslation().dashboardTranslations.studentHistory;
  const { canView } = useStudentFieldAccess();
  const monthStr = currentMonth.toLocaleString(getLatnLocaleTag(locale), { month: "long" });
  const yearStr = currentMonth.getFullYear();

  const canGoPrev = !enrollmentMonth || currentMonth > enrollmentMonth;
  const canGoNext = !nowMonth || currentMonth < nowMonth;

  if (!canView("student_history")) {
    const restricted = <ProfileRestrictedSection title={t.pageTitle("{name}")} />;
    return embedded ? restricted : <DesktopPageContainer>{restricted}</DesktopPageContainer>;
  }

  const body = (
    <>
      <Box sx={{ mb: 4 }}>
        <DesktopPageHeader
          title={t.pageTitle(studentName)}
          subtitle={t.pageSubtitle(monthStr)}
          titleVariant="headlineMd"
          breadcrumbs={[{ label: t.breadcrumbs.archive }]}
          actions={
            <ExportButton startIcon={<PictureAsPdf sx={{ fontSize: 20 }} />} onClick={onPrint}>
              {t.exportPdf}
            </ExportButton>
          }
        />
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 4, gap: 2 }}>
        <IconButton
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          sx={theme => ({
            transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            opacity: canGoPrev ? 1 : 0.5,
            pointerEvents: canGoPrev ? "auto" : "none",
          })}
        >
          <ChevronLeft />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarToday sx={theme => ({ fontSize: 20, color: theme.palette.primary.main })} />
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
            {monthStr} {yearStr}
          </Typography>
        </Box>
        <IconButton
          onClick={onNextMonth}
          disabled={!canGoNext}
          sx={theme => ({
            transform: theme.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)",
            opacity: canGoNext ? 1 : 0.5,
            pointerEvents: canGoNext ? "auto" : "none",
          })}
        >
          <ChevronRight />
        </IconButton>
      </Box>

      <Box sx={{ mb: 4 }}>
        <DesktopMetricCardGrid
          metrics={
            [
              {
                key: "total-classes",
                count: metrics.totalClasses,
                labelKey: "total-classes",
                label: t.metrics.totalClasses(metrics.totalClasses),
                icon: School,
              },
              {
                key: "attendance-rate",
                count: `${metrics.attendanceRate}%`,
                labelKey: "attendance-rate",
                label: t.metrics.attendanceRate(metrics.attendanceRate),
                icon: VerifiedUser,
              },
              {
                key: "hours-studied",
                count: `${metrics.hoursStudied}h`,
                labelKey: "hours-studied",
                label: t.metrics.hoursStudied(metrics.hoursStudied),
                icon: Timer,
              },
              {
                key: "performance",
                count: `${metrics.performance}%`,
                labelKey: "performance",
                label: t.metrics.performance(metrics.performance),
                icon: TrendingUp,
              },
            ] satisfies MetricItem[]
          }
          size={{ xs: 12, sm: 6, md: 3 }}
        />
      </Box>

      <CalendarGridDesktop currentMonth={currentMonth} classes={classes} />
    </>
  );

  if (embedded) {
    return body;
  }

  return <DesktopPageContainer>{body}</DesktopPageContainer>;
}
