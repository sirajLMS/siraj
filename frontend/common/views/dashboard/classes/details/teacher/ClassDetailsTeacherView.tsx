// NEW FOR PLAN v5: tier-agnostic teacher/parent view composed from existing teacher/ sub-components.
// specs.md §6.1 — this view lives in frontend/common/views/dashboard/classes/details/teacher/ and
// is consumed by BOTH mobile and desktop ClassDetailsContent wrappers via `<ClassDetailsTeacherView
// {...props} labels={labels} />` (see classDetailsContent.{mobile,desktop}.tsx). It owns no state,
// no queries, no side-effects — pure JSX composition of the teacher-domain sub-cards, all of which
// receive labels from the `TeacherViewLabels` typed prop bag (lifted via useTeacherViewLabels).
// Tier-specific styling glue (PageHeader variant, padding, section gaps) is the responsibility of
// the tier-side consumer; here we render the tier-neutral composition with MUI Grid/Stack only.

import { Grid, Stack } from "@mui/material";
import type { ClassInstanceStudentInfo } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ClassExecutionState } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ActionsPanel } from "@/frontend/common/views/dashboard/classes/details/teacher/ActionsPanel";
import { ClassInstanceDetailsCard } from "@/frontend/common/views/dashboard/classes/details/teacher/ClassInstanceDetailsCard";
import { PerformanceOverviewCard } from "@/frontend/common/views/dashboard/classes/details/teacher/PerformanceOverviewCard";
import { RemarksCard } from "@/frontend/common/views/dashboard/classes/details/teacher/RemarksCard";
import { StudentProfileCard } from "@/frontend/common/views/dashboard/classes/details/teacher/StudentProfileCard";
import { TimezoneWarningBanner } from "@/frontend/common/views/dashboard/classes/details/teacher/TimezoneWarningBanner";
import type { TeacherViewProps } from "@/frontend/common/views/dashboard/classes/details/types";
import type { TeacherViewLabels } from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels";
import type { ClassInstanceStatus } from "@/frontend/common/views/dashboard/types/dashboard";

interface ClassDetailsTeacherViewProps extends TeacherViewProps {
  readonly labels: TeacherViewLabels;
}

// ClassExecutionState enum values → ClassInstanceStatus union keys consumed by ClassInstanceDetailsCard.
const EXECUTION_STATE_TO_STATUS: Record<ClassExecutionState, ClassInstanceStatus> = {
  [ClassExecutionState.Activated]: "active",
  [ClassExecutionState.Running]: "active",
  [ClassExecutionState.Completed]: "completed",
  [ClassExecutionState.NotActivated]: "scheduled",
};

const NULL_STUDENT: Omit<ClassInstanceStudentInfo, "__typename"> = {
  id: null,
  name: null,
  avatarUrl: null,
  grade: null,
  level: null,
};

export function ClassDetailsTeacherView(props: Readonly<ClassDetailsTeacherViewProps>) {
  const {
    instance,
    labels,
    viewMode,
    isWarningDismissed,
    onDismissWarning,
    onActivate,
    onStop,
    onInfoEdit,
    onDelete,
    formattedStartTime,
    formattedEndTime,
  } = props;

  const isTeacherView = viewMode === "teacher";
  const executionState = instance.executionState;
  const status: ClassInstanceStatus = executionState ? EXECUTION_STATE_TO_STATUS[executionState] : "scheduled";
  const student = instance.student ?? NULL_STUDENT;
  const performance = instance.performance;
  const performanceHasData =
    performance?.attendanceRate != null || performance?.avgGrade != null || performance?.lastClassDaysAgo != null;

  return (
    <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
      {!isWarningDismissed &&
      instance.hasTimezoneMismatch &&
      instance.studentTimezone &&
      instance.teacherTimezone ? (
        <TimezoneWarningBanner
          studentTimezone={instance.studentTimezone}
          teacherTimezone={instance.teacherTimezone}
          onDismiss={onDismissWarning}
          labels={labels.timezone}
        />
      ) : null}

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ClassInstanceDetailsCard
            instanceId={instance.instanceId ?? instance.id ?? ""}
            studentId={student.id ?? ""}
            studentName={student.name ?? ""}
            courseModule={instance.courseName ?? ""}
            subjectId={instance.subjectId ?? ""}
            subjectName={instance.subjectName ?? ""}
            startTime={formattedStartTime}
            endTime={formattedEndTime}
            durationMinutes={instance.durationMinutes ?? 0}
            status={status}
            labels={labels.instanceDetails}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <StudentProfileCard student={student} labels={labels.studentProfile} />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, lg: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <PerformanceOverviewCard
            attendanceRate={performance?.attendanceRate ?? 0}
            avgGrade={performance?.avgGrade ?? "—"}
            lastClassDaysAgo={performance?.lastClassDaysAgo ?? 0}
            hasData={performanceHasData}
            labels={labels.performance}
          />
        </Grid>
        {isTeacherView ? (
          <Grid size={{ xs: 12, lg: 6 }}>
            <RemarksCard remarks={instance.remarks ?? ""} labels={labels.remarks} />
          </Grid>
        ) : null}
      </Grid>

      {isTeacherView ? (
        <ActionsPanel
          onActivate={onActivate}
          onStop={onStop}
          onInfoEdit={onInfoEdit}
          onDelete={onDelete}
          labels={labels.actions}
        />
      ) : null}
    </Stack>
  );
}
