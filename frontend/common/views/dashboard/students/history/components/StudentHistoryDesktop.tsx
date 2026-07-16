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
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { PageHeader } from "@/frontend/common/components/ui/container";
import { CalendarGrid } from "@/frontend/common/views/dashboard/students/history/components/CalendarGrid";
import type { StudentHistoryDesktopProps } from "@/frontend/common/views/dashboard/students/history/types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppTranslation } from "@/shared/locale";

export function StudentHistoryDesktop({
  studentName,
  currentMonth,
  metrics,
  classes,
  onPrevMonth,
  onNextMonth,
  onPrint,
  enrollmentMonth,
  nowMonth,
  locale,
}: Readonly<StudentHistoryDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.studentHistory;
  const monthStr = currentMonth.toLocaleString(getLatnLocaleTag(locale), { month: "long" });
  const yearStr = currentMonth.getFullYear();

  const canGoPrev = !enrollmentMonth || currentMonth > enrollmentMonth;
  const canGoNext = !nowMonth || currentMonth < nowMonth;

  return (
    <Box sx={{ display: { xs: "none", md: "block" } }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
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

      <Box sx={theme => ({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: theme.layout.gutter, mb: 4 })}>
        <MetricCard
          icon={School}
          label={t.metrics.totalClasses(metrics.totalClasses)}
          value={metrics.totalClasses}
          variant="default"
        />
        <MetricCard
          icon={VerifiedUser}
          label={t.metrics.attendanceRate(metrics.attendanceRate)}
          value={`${metrics.attendanceRate}%`}
          variant="default"
        />
        <MetricCard
          icon={Timer}
          label={t.metrics.hoursStudied(metrics.hoursStudied)}
          value={`${metrics.hoursStudied}h`}
          variant="default"
        />
        <MetricCard
          icon={TrendingUp}
          label={t.metrics.performance(metrics.performance)}
          value={`${metrics.performance}%`}
          variant="default"
        />
      </Box>

      <CalendarGrid currentMonth={currentMonth} classes={classes} />
    </Box>
  );
}
