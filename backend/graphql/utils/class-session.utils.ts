import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { ClassExecutionState, ClassOutcome } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import {
  parseClassExecutionState,
  parseClassOutcome,
  parseClassType,
  parseIanaTimezone,
  parseIanaTimezoneOrNull,
} from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { ClassInstanceDetailReturnType } from "@/backend/types";
import type { ClassInstancePerformanceSelectType } from "@/backend/types/classes/class-instance-performance.types";

type ClassInstanceWithRelations = NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>;

/**
 * Maps the execution state and outcome to a valid ClassExecutionState value
 * for the GraphQL `status` field. The old logic `(outcome || executionState)`
 * leaked "PENDING" (a ClassOutcome value) into the ClassExecutionState-typed
 * status field, which GraphQL rejected during serialization.
 */
function resolveClassInstanceStatus(
  executionState: ClassExecutionState | null | undefined,
  _outcome: ClassOutcome | null | undefined
): ClassExecutionState {
  const state = executionState ?? ClassExecutionState.NOT_ACTIVATED;

  if (state === ClassExecutionState.COMPLETED) return ClassExecutionState.COMPLETED;
  if (state === ClassExecutionState.ACTIVATED) return ClassExecutionState.ACTIVATED;
  if (state === ClassExecutionState.RUNNING) return ClassExecutionState.RUNNING;
  return ClassExecutionState.NOT_ACTIVATED;
}

function truncateQualifications(value: string | null | undefined, maxLength = 80): string | null {
  if (!value?.trim()) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
}

function resolveInstanceAvatarUrl(instance: ClassInstanceWithRelations): string | null {
  return resolveClassAvatarUrl(
    (instance as { recurring?: { avatarUrl?: string | null } }).recurring?.avatarUrl,
    (instance as { subject?: { avatarUrl?: string | null } }).subject?.avatarUrl
  );
}

function buildStudentParticipant(instance: ClassInstanceWithRelations, unknownName: string) {
  return {
    id: instance.student?.id || instance.studentId,
    name: instance.student?.name || unknownName,
    grade: null,
    level: null,
    avatarUrl: instance.student?.avatarUrl ?? null,
  };
}

function buildTeacherParticipant(instance: ClassInstanceWithRelations, unknownName: string) {
  return {
    id: instance.teacher?.id || instance.teacherId,
    name: instance.teacher?.user?.name || unknownName,
    title: truncateQualifications(instance.teacher?.qualifications),
    avatarUrl: instance.teacher?.user?.avatarUrl ?? null,
  };
}

function buildPerformanceBlock(perf: ClassInstancePerformanceSelectType | null) {
  if (!perf) return null;
  return {
    id: perf.id,
    engagementScore: perf.engagementScore ?? null,
    assessmentProgress: perf.assessmentProgress ?? null,
    assessmentTotal: perf.assessmentTotal ?? null,
    focusLevel: perf.focusLevel ?? null,
    sessionHealth: perf.sessionHealth ?? null,
    heatmapData: perf.heatmapData ?? null,
    latencyMs: perf.latencyMs ?? null,
    authorizationLabel: perf.authorizationLabel ?? null,
    attendanceRate: perf.attendanceRate ?? null,
    avgGrade: perf.avgGrade ?? null,
    lastClassDaysAgo: perf.lastClassDaysAgo ?? null,
  };
}

export async function buildClassInstanceDetail(
  instance: ClassInstanceWithRelations,
  perf: ClassInstancePerformanceSelectType | null,
  locale?: string
): Promise<ClassInstanceDetailReturnType> {
  const t = await getBackendTranslations({ locale, namespace: "session" });
  const tErrors = await getBackendTranslations({ locale, namespace: "errors" });
  const unknownName = tErrors("unknownName");
  const classType = parseClassType(instance.classType);
  const courseName = t(`classTypes.${classType}`);

  const start = instance.scheduledStartAt;
  const end = instance.scheduledEndAt;
  const studentTimezone = parseIanaTimezone(await SchedulingRepository.resolveStudentTimezone(instance.studentId));
  const teacherTimezone = parseIanaTimezoneOrNull(instance.teacher?.user?.timezone ?? null);
  const hasTimezoneMismatch =
    teacherTimezone !== null && studentTimezone !== null && teacherTimezone !== studentTimezone;

  const startTime = start.toISOString().split("T")[1].substring(0, 5);
  const endTime = end.toISOString().split("T")[1].substring(0, 5);
  return {
    ...instance,
    instanceId: instance.id,
    courseName,
    avatarUrl: resolveInstanceAvatarUrl(instance),
    classType,
    scheduledDate: start.toISOString().split("T")[0],
    startTime,
    endTime,
    remarks: instance.remarks ?? null,
    status: resolveClassInstanceStatus(
      parseClassExecutionState(instance.executionState),
      parseClassOutcome(instance.outcome)
    ),
    executionState: parseClassExecutionState(instance.executionState),
    outcome: parseClassOutcome(instance.outcome),
    hasTimezoneMismatch,
    studentTimezone,
    teacherTimezone,
    meetingJoinUrl: instance.meetingJoinUrl ?? null,
    student: buildStudentParticipant(instance, unknownName),
    teacher: buildTeacherParticipant(instance, unknownName),
    performance: buildPerformanceBlock(perf),
  };
}

export async function resolveDetail(
  userId: string,
  classInstanceId: string,
  locale?: string
): Promise<ClassInstanceDetailReturnType> {
  const { ClassSessionService } = await import("@/backend/services/session/class-session.service");
  return ClassSessionService.getClassInstanceDetail(userId, classInstanceId, locale);
}
