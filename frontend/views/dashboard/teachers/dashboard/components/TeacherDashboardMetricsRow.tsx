"use client";

import { CheckCircleOutlined, EventBusyOutlined, EventOutlined, GroupsOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { MetricCard } from "@/frontend/components/ui";
import type { TeacherDashboardMetrics } from "@/frontend/stores/mockTeacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";

interface TeacherDashboardMetricsRowProps {
  readonly metrics: TeacherDashboardMetrics;
  readonly labels: TeacherDashboardLabels["metrics"];
  readonly isMobile: boolean;
}

function formatCount(value: number, pad: boolean): string {
  if (pad) {
    return String(value).padStart(2, "0");
  }
  return String(value);
}

export function TeacherDashboardMetricsRow({ metrics, labels, isMobile }: Readonly<TeacherDashboardMetricsRowProps>) {
  if (isMobile) {
    return (
      <Grid container spacing={2}>
        <Grid size={6}>
          <MetricCard
            icon={EventOutlined}
            label={labels.totalClasses}
            value={formatCount(metrics.totalClasses, false)}
            variant="compact"
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={EventBusyOutlined}
            label={labels.missedSlots}
            value={formatCount(metrics.missedSlots, false)}
            variant="error"
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={CheckCircleOutlined}
            label={labels.completed}
            value={formatCount(metrics.completed, false)}
            variant="compact"
          />
        </Grid>
        <Grid size={6}>
          <MetricCard
            icon={GroupsOutlined}
            label={labels.studentsToday}
            value={formatCount(metrics.studentsToday, false)}
            variant="compact"
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard icon={EventOutlined} label={labels.totalClasses} value={formatCount(metrics.totalClasses, true)} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={EventBusyOutlined}
          label={labels.missedSlots}
          value={formatCount(metrics.missedSlots, true)}
          variant="error"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={CheckCircleOutlined}
          label={labels.completed}
          value={formatCount(metrics.completed, true)}
          variant="highlight"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          icon={GroupsOutlined}
          label={labels.studentsToday}
          value={formatCount(metrics.studentsToday, true)}
        />
      </Grid>
    </Grid>
  );
}
