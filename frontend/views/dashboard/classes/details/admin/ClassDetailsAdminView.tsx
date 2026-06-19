"use client";

import { Box, Grid } from "@mui/material";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, type ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AdminViewLabels } from "@/shared/messages/types/message";
import { ClassDetailsToolbarArea } from "../components/ClassDetailsToolbarArea";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { AdminActionsBar } from "./AdminActionsBar";
import { ClassInfoCard } from "./ClassInfoCard";
import { LivePerformanceGrid } from "./LivePerformanceGrid";
import { MetadataCard } from "./MetadataCard";

interface ClassDetailsAdminViewProps {
  readonly instance: ClassInstanceDetail;
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

export function ClassDetailsAdminView({
  instance,
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
  const performanceMetrics = [
    { key: "engagement", labelKey: "engagementScore", value: `${instance.performance?.engagementScore ?? 0}%` },
    {
      key: "assessment",
      labelKey: "assessmentProgress",
      value: `${instance.performance?.assessmentProgress ?? 0}/${instance.performance?.assessmentTotal ?? 0}`,
    },
    { key: "focus", labelKey: "focusLevel", value: instance.performance?.focusLevel ?? "" },
    { key: "health", labelKey: "sessionHealth", value: instance.performance?.sessionHealth ?? "" },
  ];

  const heatmapData = toNumberArray(instance.performance?.heatmapData);

  return (
    <Box>
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

      {/* Admin Actions Bar */}
      <RequirePermission permissions={[AppPermission.SessionOverrideActions]}>
        <AdminActionsBar
          onForceActivate={onForceActivate}
          onStop={onStop}
          onGenerateLog={onGenerateLog}
          onReschedule={onReschedule}
          onDelete={onDelete}
          labels={labels.adminActions}
        />
      </RequirePermission>

      {/* Class Info + Metadata */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ClassInfoCard
            courseName={instance.courseName ?? ""}
            instanceId={instance.instanceId ?? ""}
            student={{
              id: instance.student?.id ?? "",
              name: instance.student?.name ?? "",
              grade: instance.student?.grade ?? "",
              level: Number(instance.student?.level ?? 0),
              avatarUrl: instance.student?.avatarUrl ?? "",
            }}
            teacher={{
              name: instance.teacher?.name ?? "",
              title: instance.teacher?.title ?? "",
              avatarUrl: instance.teacher?.avatarUrl ?? "",
            }}
            isActive={instance.status === "active"}
            labels={labels.classInfo}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetadataCard
            scheduledDate={instance.scheduledDate ?? ""}
            durationMinutes={instance.durationMinutes ?? 0}
            latencyMs={instance.performance?.latencyMs ?? 0}
            authorization="OAuth 2.0 SSL"
            labels={labels.metadata}
          />
        </Grid>
      </Grid>

      {/* Live Performance Overview */}
      <LivePerformanceGrid metrics={performanceMetrics} labels={labels.performance} />

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmapData} labels={labels.heatmap} />
    </Box>
  );
}
