import {
  CalendarToday,
  ChevronRight,
  PictureAsPdf,
  School,
  Timer,
  TrendingUp,
  VerifiedUser,
} from "@mui/icons-material";
import { Box, type Theme, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { ClassSession, StudentHistoryMetrics } from "@/frontend/stores/mockStudentHistoryStore";
import { ClassSessionList } from "./ClassSessionList";
import { MobileWeeklyScroller } from "./MobileWeeklyScroller";
import { PerformanceStreak } from "./PerformanceStreak";

interface StudentHistoryMobileProps {
  studentName: string;
  currentMonth: Date;
  metrics: StudentHistoryMetrics;
  classes: Readonly<Partial<Record<number, ClassSession>>>;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
}

export function StudentHistoryMobile({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  onSelectWeek,
}: Readonly<StudentHistoryMobileProps>) {
  const monthStr = currentMonth.toLocaleString("en-US", { month: "long" });

  return (
    <Box sx={{ display: { xs: "block", md: "none" } }}>
      <HistoryMobileHeader studentName={studentName} monthStr={monthStr} />

      <HistoryMobileMetricsGrid metrics={metrics} />

      <HistoryMobileActions />

      <MobileWeeklyScroller selectedWeek={selectedWeek} onSelectWeek={onSelectWeek} />
      <ClassSessionList dateStr="Tuesday Oct 15" sessions={classes[15] ? [classes[15]] : []} />
      <PerformanceStreak />
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

function HistoryMobileMetricsGrid({ metrics }: Readonly<{ metrics: StudentHistoryMetrics }>) {
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
        value={metrics.performance}
        bg={theme => theme.palette.errorContainer}
      />
    </Box>
  );
}

function HistoryMobileActions() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 2,
      }}
    >
      <Box
        component="button"
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: theme.palette.primary.main,
          px: 2,
          py: 1,
          borderRadius: 2,
          color: theme.palette.onPrimary,
          border: "none",
          cursor: "pointer",
          "&:active": { transform: "scale(0.95)" },
          transition: "transform 0.2s",
        })}
      >
        <CalendarToday sx={{ fontSize: 18 }} />
        <Typography variant="buttonText">OCTOBER 2024</Typography>
      </Box>
      <Box
        component="button"
        sx={theme => ({
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.surfaceContainerHigh,
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

function MobileMetric({
  title,
  icon,
  value,
  bg,
}: Readonly<{
  title: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  bg: string | ((theme: Theme) => string);
}>) {
  return (
    <Box
      sx={theme => ({
        bgcolor: theme.palette.surfaceContainerLowest,
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
            bgcolor: typeof bg === "function" ? bg(theme) : bg,
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
