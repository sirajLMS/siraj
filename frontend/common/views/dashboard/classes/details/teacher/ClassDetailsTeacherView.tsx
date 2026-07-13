"use client";

import { Box, Grid } from "@mui/material";
import type { ClassInstanceDetail } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classDetailsSectionStackSx } from "@/frontend/common/views/dashboard/classes/details/classDetailsMobileLayout";
import { ClassDetailsToolbarArea } from "@/frontend/common/views/dashboard/classes/details/components/ClassDetailsToolbarArea";
import { ActionsPanel } from "@/frontend/common/views/dashboard/classes/details/teacher/ActionsPanel";
import { ClassInstanceDetailsCard } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard";
import { PerformanceOverviewCard } from "@/frontend/common/views/dashboard/classes/details/teacher/PerformanceOverviewCard";
import { RemarksCard } from "@/frontend/common/views/dashboard/classes/details/teacher/RemarksCard";
import { StudentProfileCard } from "@/frontend/common/views/dashboard/classes/details/teacher/StudentProfileCard";
import type { ClassDetailsViewMode } from "@/frontend/common/views/dashboard/classes/details/types";
import type { TeacherViewLabels } from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { RecurringSeriesMeetingPanel } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/RecurringSeriesMeetingPanel";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

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

  const showMeetingConfigs = viewMode !== "parent";
  const recurringScheduleId = instance.recurringScheduleId ?? undefined;

  return (
    <Box sx={classDetailsSectionStackSx}>
      <ClassDetailsToolbarArea
        instance={instance}
        viewMode={viewMode === "parent" ? "parent" : "teacher"}
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
            {showMeetingConfigs ? (
              <ClassMeetingConfigsSection
                classInstanceId={instance.id ?? undefined}
                effectiveMeeting={instance.effectiveMeeting}
              />
            ) : null}
            {showMeetingConfigs && recurringScheduleId ? (
              <RecurringSeriesMeetingPanel
                recurringScheduleId={recurringScheduleId}
                effectiveMeeting={instance.effectiveMeeting}
              />
            ) : null}
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
              student={instance.student ?? { id: "", name: "", grade: null, level: null, avatarUrl: null }}
              labels={labels.studentProfile}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
