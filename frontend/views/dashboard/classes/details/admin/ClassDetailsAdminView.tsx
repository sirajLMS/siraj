"use client";

import { Box, Grid } from "@mui/material";
import type { AdminViewLabels } from "@/frontend/messages/types/message";
import type { ClassInstance } from "@/frontend/views/dashboard/types/dashboard";
import { TimezoneWarningBanner } from "../teacher/TimezoneWarningBanner";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { AdminActionsBar } from "./AdminActionsBar";
import { ClassInfoCard } from "./ClassInfoCard";
import { LivePerformanceGrid } from "./LivePerformanceGrid";
import { MetadataCard } from "./MetadataCard";

interface ClassDetailsAdminViewProps {
  readonly instance: ClassInstance;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onDelete: () => void;
  readonly labels: AdminViewLabels;
}

export function ClassDetailsAdminView({
  instance,
  isWarningDismissed,
  onDismissWarning,
  onForceActivate,
  onStop,
  onGenerateLog,
  onDelete,
  labels,
}: ClassDetailsAdminViewProps) {
  return (
    <Box>
      {/* Timezone Warning */}
      {!isWarningDismissed && instance.hasTimezoneMismatch && (
        <TimezoneWarningBanner
          studentTimezone={instance.studentTimezone}
          onDismiss={onDismissWarning}
          labels={labels.timezone}
        />
      )}

      {/* Admin Actions Bar */}
      <AdminActionsBar
        onForceActivate={onForceActivate}
        onStop={onStop}
        onGenerateLog={onGenerateLog}
        onDelete={onDelete}
        labels={labels.adminActions}
      />

      {/* Class Info + Metadata */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <ClassInfoCard
            courseName={instance.courseName}
            instanceId={instance.instanceId}
            student={instance.student}
            teacher={instance.teacher}
            isActive={instance.status === "active"}
            labels={labels.classInfo}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetadataCard
            scheduledDate={instance.scheduledDate}
            durationMinutes={instance.durationMinutes}
            latencyMs={instance.latencyMs}
            authorization={instance.authorization}
            labels={labels.metadata}
          />
        </Grid>
      </Grid>

      {/* Live Performance Overview */}
      <LivePerformanceGrid metrics={instance.performanceMetrics} labels={labels.performance} />

      {/* Activity Heatmap */}
      <ActivityHeatmap data={instance.heatmapData} labels={labels.heatmap} />
    </Box>
  );
}
