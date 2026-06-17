import { CalendarToday, PictureAsPdf, School, Timer, TrendingUp, VerifiedUser } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { ExportButton, MetricCard, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/stores/mockStudentHistoryStore";
import { CalendarGrid } from "./CalendarGrid";

interface StudentHistoryDesktopProps {
  studentName: string;
  currentMonth: Date;
  metrics: StudentHistoryMetrics;
  classes: Readonly<Partial<Record<number, ClassSession>>>;
  onSelectDay: (day: number) => void;
}

export function StudentHistoryDesktop({
  studentName,
  currentMonth,
  metrics,
  classes,
  onSelectDay,
}: Readonly<StudentHistoryDesktopProps>) {
  const t = useTranslations("dashboard.studentHistory");
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });

  return (
    <Box sx={{ display: { xs: "none", md: "block" } }}>
      <Box sx={{ mb: 4 }}>
        <PageHeader
          title={`${t("pageTitle", { name: studentName })} ${t("pageSubtitle", {
            month: monthStr,
          }).replace(" • Academic Year 2024/25", "")}`}
          titleVariant="headlineMd"
          breadcrumbs={[{ label: t("breadcrumbs.archive") }]}
          actions={
            <>
              <ExportButton startIcon={<PictureAsPdf sx={{ fontSize: 20 }} />}>{t("exportPdf")}</ExportButton>
              <PrimaryPageAction startIcon={<CalendarToday sx={{ fontSize: 20 }} />}>
                {t("changeMonth")}
              </PrimaryPageAction>
            </>
          }
        />
      </Box>

      <Box sx={theme => ({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: theme.layout.gutter, mb: 4 })}>
        <MetricCard icon={School} label={t("metrics.totalClasses")} value={metrics.totalClasses} variant="default" />
        <MetricCard
          icon={VerifiedUser}
          label={t("metrics.attendanceRate")}
          value={`${metrics.attendanceRate}%`}
          variant="default"
        />
        <MetricCard
          icon={Timer}
          label={t("metrics.hoursStudied")}
          value={`${metrics.hoursStudied}h`}
          variant="default"
        />
        <MetricCard icon={TrendingUp} label={t("metrics.performance")} value={metrics.performance} variant="default" />
      </Box>

      <CalendarGrid currentMonth={currentMonth} classes={classes} onSelectDay={onSelectDay} />
    </Box>
  );
}
