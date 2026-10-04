import type {
  TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes,
  TeacherWorkloadMetricsQuery_teacherWorkloadMetrics,
} from "@/frontend/common/graphql/generated/gql/graphql";

type ScheduleClass = TeacherWeeklyScheduleGridQuery_teacherWeeklyScheduleGrid_classes;

export type ScheduleGrid = {
  teacherId: string | null;
  weekEnd: string | null;
  classes: ReadonlyArray<ScheduleClass> | null;
};

export type Workload = TeacherWorkloadMetricsQuery_teacherWorkloadMetrics | null | undefined;

export function buildScheduleViewModel(schedule: ScheduleGrid, workload: Workload, teacherName: string) {
  return {
    teacherId: schedule?.teacherId ?? "",
    teacherName,
    weeklyHoursWorked: workload?.weeklyHoursWorked ?? "0:00",
    classes: (schedule?.classes ?? []).map(c => ({
      id: c.id ?? "",
      studentName: c.studentName ?? "",
      studentId: c.studentId ?? "",
      duration: c.duration ?? 0,
      startTime: c.startTime ?? "",
      day: c.day ?? "",
      executionState: c.executionState,
      outcome: c.outcome,
      subjectName: c.subjectName ?? null,
      classType: c.classType ?? null,
      meetingJoinUrl: c.meetingJoinUrl,
      effectiveMeeting: c.effectiveMeeting,
      isFrozen: c.isFrozen ?? false,
    })),
    lastUpdated: schedule?.weekEnd ?? new Date().toLocaleTimeString(),
  };
}
