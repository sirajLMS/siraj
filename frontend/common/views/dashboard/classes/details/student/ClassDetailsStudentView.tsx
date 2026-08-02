"use client";

import { Grid, Stack } from "@mui/material";
import { ClassExecutionState } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ClassDetailsToolbarArea } from "@/frontend/common/views/dashboard/classes/details/components/ClassDetailsToolbarArea";
import { ClassInstanceDetailsCard } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard";
import { RemarksCard } from "@/frontend/common/views/dashboard/classes/details/teacher/RemarksCard";
import { TeacherProfileCard } from "@/frontend/common/views/dashboard/classes/details/teacher/TeacherProfileCard";
import type { StudentViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { StudentViewLabels } from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

interface ClassDetailsStudentViewProps extends StudentViewProps {
  readonly labels: StudentViewLabels;
}

const EXECUTION_STATE_TO_STATUS: Record<ClassExecutionState, ClassInstanceStatus> = {
  [ClassExecutionState.Activated]: "active",
  [ClassExecutionState.Running]: "active",
  [ClassExecutionState.Completed]: "completed",
  [ClassExecutionState.NotActivated]: "scheduled",
  [ClassExecutionState.OnDemandConflictHeld]: "pending",
  [ClassExecutionState.OnDemandNoCreditsAbsent]: "cancelled",
  [ClassExecutionState.OnDemandNoCreditsCancelled]: "cancelled",
  [ClassExecutionState.OnDemandPendingCredits]: "pending",
};

const NULL_TEACHER = {
  id: null,
  name: null,
  title: null,
  avatarUrl: null,
};

export function ClassDetailsStudentView(props: Readonly<ClassDetailsStudentViewProps>) {
  const {
    instance,
    labels,
    isWarningDismissed,
    onDismissWarning,
    formattedStartTime,
    formattedEndTime,
    onStart,
    onAbsent,
    onLeave,
    onReset,
    isStarting,
    isMarkingAbsent,
    isProcessingLeave,
    isResetting,
    error,
  } = props;

  const executionState = instance.executionState;
  const status: ClassInstanceStatus = executionState ? EXECUTION_STATE_TO_STATUS[executionState] : "scheduled";
  const teacher = instance.teacher ?? NULL_TEACHER;

  return (
    <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
      <ClassDetailsToolbarArea
        instance={instance}
        viewMode="student"
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

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ClassInstanceDetailsCard
            studentId=""
            studentName=""
            courseModule={instance.courseName ?? ""}
            subjectId={instance.subjectId ?? ""}
            subjectName={instance.subjectName ?? ""}
            subjectAvatarUrl={instance.subjectAvatarUrl}
            startTime={formattedStartTime}
            endTime={formattedEndTime}
            durationMinutes={instance.durationMinutes ?? 0}
            status={status}
            rateAmount={null}
            rateCurrency={null}
            rateSource={null}
            isRateOverridden={false}
            hideStudentField
            hideRateSection
            labels={labels.instanceDetails}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <TeacherProfileCard teacher={teacher} labels={labels.teacherProfile} />
        </Grid>
      </Grid>

      {instance.remarks ? <RemarksCard remarks={instance.remarks} labels={labels.remarks} /> : null}
    </Stack>
  );
}
