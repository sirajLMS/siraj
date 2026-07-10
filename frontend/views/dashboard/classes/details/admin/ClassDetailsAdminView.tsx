"use client";

import { Box, Grid } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  ClassExecutionState,
  type ClassInstanceDetail,
} from "@/frontend/graphql/generated/gql/graphql-types";
import { ActivityHeatmap } from "@/frontend/views/dashboard/classes/details/admin/ActivityHeatmap";
import { AdminActionsBar } from "@/frontend/views/dashboard/classes/details/admin/AdminActionsBar";
import { ClassInfoCard } from "@/frontend/views/dashboard/classes/details/admin/ClassInfoCard";
import { LivePerformanceGrid } from "@/frontend/views/dashboard/classes/details/admin/LivePerformanceGrid";
import { MetadataCard } from "@/frontend/views/dashboard/classes/details/admin/MetadataCard";
import { classDetailsSectionStackSx } from "@/frontend/views/dashboard/classes/details/classDetailsMobileLayout";
import { ClassDetailsToolbarArea } from "@/frontend/views/dashboard/classes/details/components/ClassDetailsToolbarArea";
import { ClassMeetingConfigsSection } from "@/frontend/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import type { AdminViewLabels } from "@/shared/messages/types/message";

export interface ClassDetailsAdminViewProps {
  readonly instance: ClassInstanceDetail;
  readonly formattedScheduledDate: string;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
  readonly onDelete: () => void;
  readonly labels: AdminViewLabels;
  readonly onStart: () => void;
  readonly onAbsent: () => void;
  readonly onLeave: (reason: string) => void;
  readonly onReset: () => void;
  readonly isStarting: boolean;
  readonly isMarkingAbsent: boolean;
  readonly isProcessingLeave: boolean;
  readonly isResetting: boolean;
  readonly error: string | null;
}

function toNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is number => typeof v === "number");
  }
  return [];
}

const LIVE_EXECUTION_STATES = new Set(["ACTIVATED", "RUNNING"]);

export function ClassDetailsAdminView({
  instance,
  formattedScheduledDate,
  isWarningDismissed,
  onDismissWarning,
  onForceActivate,
  onStop,
  onGenerateLog,
  onReschedule,
  onDelete,
  labels,
  onStart,
  onAbsent,
  onLeave,
  onReset,
  isStarting,
  isMarkingAbsent,
  isProcessingLeave,
  isResetting,
  error,
}: ClassDetailsAdminViewProps) {
  const performance = instance.performance;
  const hasPerformance = performance != null;
  const showLiveMetadata = LIVE_EXECUTION_STATES.has(instance.executionState ?? "");

  const performanceMetrics = hasPerformance
    ? [
        { key: "engagement", labelKey: "engagementScore", value: `${performance.engagementScore ?? 0}%` },
        {
          key: "assessment",
          labelKey: "assessmentProgress",
          value: `${performance.assessmentProgress ?? 0}/${performance.assessmentTotal ?? 0}`,
        },
        { key: "focus", labelKey: "focusLevel", value: performance.focusLevel ?? "" },
        { key: "health", labelKey: "sessionHealth", value: performance.sessionHealth ?? "" },
      ]
    : [];

  const heatmapData = toNumberArray(performance?.heatmapData);

  return (
    <Box sx={classDetailsSectionStackSx}>
      <ClassDetailsToolbarArea
        instance={instance}
        isWarningDismissed={isWarningDismissed}
        onDismissWarning={onDismissWarning}
        labels={labels}
        onStart={onStart}
        onAbsent={onAbsent}
        onLeave={onLeave}
        onReset={onReset}
        isStarting={isStarting}
        isMarkingAbsent={isMarkingAbsent}
        isProcessingLeave={isProcessingLeave}
        isResetting={isResetting}
        error={error}
      />

      <RequirePermission permissions={[AppPermission.SessionOverrideActions]}>
        <AdminActionsBar
          executionState={instance.executionState ?? "NOT_ACTIVATED"}
          onForceActivate={onForceActivate}
          onStop={onStop}
          onGenerateLog={onGenerateLog}
          onReschedule={onReschedule}
          onDelete={onDelete}
          labels={labels.adminActions}
        />
      </RequirePermission>

      <ClassMeetingConfigsSection classInstanceId={instance.id ?? undefined} />

      <Grid container rowSpacing={{ xs: 2, lg: 3 }} columnSpacing={{ xs: 0, lg: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ClassInfoCard
            courseName={instance.courseName ?? ""}
            instanceId={instance.instanceId ?? ""}
            student={instance.student ?? { id: "", name: "", grade: null, level: null, avatarUrl: null }}
            teacher={instance.teacher ?? { id: null, name: "", title: null, avatarUrl: null }}
            isActive={instance.status === ClassExecutionState.Activated}
            labels={labels.classInfo}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
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

      <LivePerformanceGrid metrics={performanceMetrics} labels={labels.performance} hasData={hasPerformance} />

      <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
    </Box>
  );
}
