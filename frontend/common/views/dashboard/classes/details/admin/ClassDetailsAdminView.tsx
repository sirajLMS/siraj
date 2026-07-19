// NEW FOR PLAN v5: tier-agnostic admin view composed from existing admin/ sub-components.
// specs.md §6.1 — this view lives in frontend/common/views/dashboard/classes/details/admin/ and
// is consumed by BOTH mobile and desktop ClassDetailsContent wrappers via `<ClassDetailsAdminView
// {...props} labels={labels} />` (see classDetailsContent.{mobile,desktop}.tsx). It owns no state,
// no queries, no side-effects — pure JSX composition of the admin-domain sub-cards, all of which
// receive labels from the `AdminViewLabels` typed prop bag (lifted via useAdminViewLabels).
// Tier-specific styling glue (PageHeader variant, padding, section gaps) is the responsibility of
// the tier-side consumer; here we render the tier-neutral composition with MUI Grid/Stack only.

import { Grid, Stack } from "@mui/material";
import { ActivityHeatmap } from "@/frontend/common/views/dashboard/classes/details/admin/ActivityHeatmap";
import { AdminActionsBar } from "@/frontend/common/views/dashboard/classes/details/admin/AdminActionsBar";
import { ClassInfoCard } from "@/frontend/common/views/dashboard/classes/details/admin/ClassInfoCard";
import { LivePerformanceGrid } from "@/frontend/common/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { MetadataCard } from "@/frontend/common/views/dashboard/classes/details/admin/MetadataCard";
import { TimezoneWarningBanner } from "@/frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner";
import type { AdminViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { AdminViewLabels } from "@/shared/locale";

interface ClassDetailsAdminViewProps extends AdminViewProps {
  readonly labels: AdminViewLabels;
}

// HeatmapData is typed as JSON[] on the GraphQL side; ActivityHeatmap expects number[].
const coerceHeatmapData = (value: ReadonlyArray<unknown> | null | undefined): readonly number[] => {
  if (!value) return [];
  return value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
};

// PerformanceMetric key/labelKey/value resolution for LivePerformanceGrid.
interface LivePerformanceMetricRow {
  readonly key: string;
  readonly labelKey: string;
  readonly value: string;
}

const buildLivePerformanceMetrics = (
  instance: AdminViewProps["instance"]
): { readonly metrics: readonly LivePerformanceMetricRow[]; readonly hasData: boolean } => {
  const perf = instance.performance;
  if (!perf) {
    return { metrics: [], hasData: false };
  }
  const metrics: readonly LivePerformanceMetricRow[] = [
    { key: "engagement", labelKey: "engagementScore", value: String(perf.engagementScore ?? "—") },
    { key: "assessment", labelKey: "assessmentProgress", value: String(perf.assessmentProgress ?? "—") },
    { key: "focus", labelKey: "focusLevel", value: perf.focusLevel ?? "—" },
    { key: "health", labelKey: "sessionHealth", value: perf.sessionHealth ?? "—" },
  ];
  const hasData = metrics.some(m => m.value !== "—");
  return { metrics, hasData };
};

export function ClassDetailsAdminView(props: Readonly<ClassDetailsAdminViewProps>) {
  const {
    instance,
    labels,
    isWarningDismissed,
    onDismissWarning,
    onForceActivate,
    onStop,
    onGenerateLog,
    onReschedule,
    onDelete,
    formattedScheduledDate,
  } = props;

  const executionState = instance.executionState ?? "";
  const student = instance.student;
  const teacher = instance.teacher;
  const performance = instance.performance;
  const showLiveMetadata = executionState === "ACTIVATED" || executionState === "RUNNING";
  const { metrics, hasData } = buildLivePerformanceMetrics(instance);
  const heatmapData = coerceHeatmapData(performance?.heatmapData);

  return (
    <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
      {!isWarningDismissed && instance.hasTimezoneMismatch && instance.studentTimezone && instance.teacherTimezone ? (
        <TimezoneWarningBanner
          studentTimezone={instance.studentTimezone}
          teacherTimezone={instance.teacherTimezone}
          onDismiss={onDismissWarning}
          labels={labels.timezone}
        />
      ) : null}

      <AdminActionsBar
        executionState={executionState}
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={onGenerateLog}
        onReschedule={onReschedule}
        onDelete={onDelete}
        labels={labels.adminActions}
      />

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
            labels={labels.classInfo}
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

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <LivePerformanceGrid metrics={metrics} hasData={hasData} labels={labels.performance} />
        </Grid>
      </Grid>
    </Stack>
  );
}
