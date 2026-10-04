"use client";

import { Grid } from "@mui/material";
import { ActivityHeatmap } from "@/frontend/common/views/dashboard/classes/details/admin/ActivityHeatmap";
import { ClassInfoCard } from "@/frontend/common/views/dashboard/classes/details/admin/ClassInfoCard";
import type { LivePerformanceMetricRow } from "@/frontend/common/views/dashboard/classes/details/admin/classDetailsAdminView.helpers";
import { LivePerformanceGrid } from "@/frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { MetadataCard } from "@/frontend/common/views/dashboard/classes/details/admin/MetadataCard";
import { TimezoneWarningBanner } from "@/frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner";
import type {
  AdminViewProps,
  ClassDetailsMetricGridSlot,
} from "@/frontend/common/views/dashboard/classes/details/types";
import type { AdminViewLabels } from "@/shared/locale";

interface ClassDetailsTimezoneWarningProps {
  readonly instance: AdminViewProps["instance"];
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly labels: AdminViewLabels;
}

export function ClassDetailsTimezoneWarning(props: Readonly<ClassDetailsTimezoneWarningProps>) {
  const { instance, isWarningDismissed, onDismissWarning, labels } = props;
  if (isWarningDismissed || !instance.hasTimezoneMismatch || !instance.studentTimezone || !instance.teacherTimezone) {
    return null;
  }
  return (
    <TimezoneWarningBanner
      studentTimezone={instance.studentTimezone}
      teacherTimezone={instance.teacherTimezone}
      onDismiss={onDismissWarning}
      labels={labels.timezone}
    />
  );
}

interface ClassDetailsInfoGridProps {
  readonly instance: AdminViewProps["instance"];
  readonly executionState: string;
  readonly showLiveMetadata: boolean;
  readonly formattedScheduledDate: string;
  readonly labels: AdminViewLabels;
}

export function ClassDetailsInfoGrid(props: Readonly<ClassDetailsInfoGridProps>) {
  const { instance, executionState, showLiveMetadata, formattedScheduledDate, labels } = props;
  const student = instance.student;
  const teacher = instance.teacher;
  const performance = instance.performance;

  return (
    <Grid container spacing={{ xs: 2, lg: 3 }}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ClassInfoCard
          courseName={instance.courseName ?? ""}
          subjectId={instance.subjectId ?? ""}
          subjectName={instance.subjectName ?? ""}
          subjectAvatarUrl={instance.subjectAvatarUrl}
          student={
            student ?? {
              id: null,
              name: null,
              avatarUrl: null,
              grade: null,
              level: null,
            }
          }
          teacher={teacher ?? { id: null, name: null, avatarUrl: null, title: null }}
          isActive={executionState === "ACTIVATED" || executionState === "RUNNING"}
          rateAmount={instance.rateAmount ?? null}
          rateCurrency={instance.rateCurrency ?? null}
          rateSource={instance.rateSource ?? null}
          isRateOverridden={instance.isRateOverridden ?? false}
          labels={labels}
        />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <MetadataCard
          scheduledDate={formattedScheduledDate}
          durationMinutes={instance.durationMinutes ?? 0}
          latencyMs={performance?.latencyMs ?? null}
          authorizationLabel={performance?.authorizationLabel ?? null}
          showLiveMetadata={showLiveMetadata}
          labels={labels.metadata}
        />
      </Grid>
    </Grid>
  );
}

interface ClassDetailsPerformanceGridProps {
  readonly heatmapData: readonly number[];
  readonly metrics: readonly LivePerformanceMetricRow[];
  readonly hasData: boolean;
  readonly labels: AdminViewLabels;
  readonly metricGrid: ClassDetailsMetricGridSlot;
}

export function ClassDetailsPerformanceGrid(props: Readonly<ClassDetailsPerformanceGridProps>) {
  const { heatmapData, metrics, hasData, labels, metricGrid } = props;

  return (
    <Grid container spacing={{ xs: 2, lg: 3 }}>
      <Grid size={{ xs: 12, lg: 7 }}>
        <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }}>
        <LivePerformanceGrid metrics={metrics} hasData={hasData} labels={labels.performance} MetricGrid={metricGrid} />
      </Grid>
    </Grid>
  );
}
