"use client";

import { Box, Grid } from "@mui/material";
import type { ClassInstanceDetail } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ClassInstanceStatus } from "@/frontend/views/dashboard/types/dashboard";
import { classDetailsSectionStackSx } from "../classDetailsMobileLayout";
import { ClassDetailsToolbarArea } from "../components/ClassDetailsToolbarArea";
import type { ClassDetailsViewMode } from "../types";
import type { TeacherViewLabels } from "../useClassDetailsLabels";
import { ActionsPanel } from "./ActionsPanel";
import { ClassInstanceDetailsCard } from "./ClassInstanceDetailsCard";
import { PerformanceOverviewCard } from "./PerformanceOverviewCard";
import { RemarksCard } from "./RemarksCard";
import { StudentProfileCard } from "./StudentProfileCard";

const EXECUTION_STATE_TO_STATUS: Record<string, ClassInstanceStatus> = {
  NOT_ACTIVATED: "pending",
  ACTIVATED: "active",
  RUNNING: "active",
  COMPLETED: "completed",
};

export interface ClassDetailsTeacherViewProps {
  readonly instance: ClassInstanceDetail;
  readonly viewMode: ClassDetailsViewMode;
  readonly formattedStartTime: string;
  readonly formattedEndTime: string;
  readonly isWarningDismissed: boolean;
  readonly onDismissWarning: () => void;
  readonly onActivate: () => void;
  readonly onStop: () => void;
  readonly onInfoEdit: () => void;
  readonly onDelete: () => void;
  readonly labels: TeacherViewLabels;
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

export function ClassDetailsTeacherView({
  instance,
  viewMode,
  formattedStartTime,
  formattedEndTime,
  isWarningDismissed,
  onDismissWarning,
  onActivate,
  onStop,
  onInfoEdit,
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
}: ClassDetailsTeacherViewProps) {
  const status: ClassInstanceStatus = EXECUTION_STATE_TO_STATUS[instance.status ?? ""] ?? "pending";
  const performance = instance.performance;
  const hasPerformance = performance != null;
  const showActionsPanel = viewMode === "teacher";

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

      <Grid container rowSpacing={{ xs: 2, lg: 3 }} columnSpacing={{ xs: 0, lg: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, lg: 3 } }}>
            <ClassInstanceDetailsCard
              instanceId={instance.id ?? ""}
              studentId={instance.student?.id ?? ""}
              studentName={instance.student?.name ?? ""}
              courseModule={instance.courseName ?? ""}
              startTime={formattedStartTime}
              endTime={formattedEndTime}
              durationMinutes={instance.durationMinutes ?? 0}
              status={status}
              labels={labels.instanceDetails}
            />
            <RemarksCard remarks={instance.remarks ?? ""} labels={labels.remarks} />
            <PerformanceOverviewCard
              attendanceRate={performance?.attendanceRate ?? 0}
              avgGrade={performance?.avgGrade ?? ""}
              lastClassDaysAgo={performance?.lastClassDaysAgo ?? 0}
              hasData={hasPerformance}
              labels={labels.performance}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, lg: 3 } }}>
            {showActionsPanel ? (
              <ActionsPanel
                onActivate={onActivate}
                onStop={onStop}
                onInfoEdit={onInfoEdit}
                onDelete={onDelete}
                labels={labels.actions}
              />
            ) : null}
            <StudentProfileCard
              student={{
                id: instance.student?.id ?? "",
                name: instance.student?.name ?? "",
                grade: "",
                level: 0,
                avatarUrl: instance.student?.avatarUrl ?? "",
              }}
              labels={labels.studentProfile}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
