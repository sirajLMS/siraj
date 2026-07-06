"use client";

import { CalendarTodayOutlined, EventBusyOutlined, SensorsOutlined, VerifiedOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/components/ui";
import type { TeacherDashboardMetrics } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

interface TeacherActiveMetricsRowProps {
  readonly metrics: TeacherDashboardMetrics;
  readonly labels: TeacherDashboardLabels["activeMetrics"];
  readonly isMobile: boolean;
}

export function TeacherActiveMetricsRow({ metrics, labels, isMobile }: Readonly<TeacherActiveMetricsRowProps>) {
  const activeSessions = metrics.activeSessions ?? 0;

  if (isMobile) {
    return null;
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={CalendarTodayOutlined} label={labels.totalClasses} value={String(metrics.totalClasses)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={SensorsOutlined} label={labels.activeSessions} value={String(activeSessions)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={EventBusyOutlined}
          label={labels.missedSlots}
          value={String(metrics.missedSlots)}
          variant="error"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={VerifiedOutlined} label={labels.completed} value={String(metrics.completed)} />
      </Grid>
    </Grid>
  );
}
