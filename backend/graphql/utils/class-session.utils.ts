import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { ClassInstanceDetailReturnType, ClassInstancePerformanceSelectType } from "@/backend/types";
import type { ClassType } from "@/shared/lib/enum";

type ClassInstanceWithRelations = NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>;

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

/**
 * Shared helper to build a ClassInstanceDetailReturnType from database entities.
 */
export async function buildClassInstanceDetail(
  instance: ClassInstanceWithRelations,
  perf: ClassInstancePerformanceSelectType | null,
  locale?: string
): Promise<ClassInstanceDetailReturnType> {
  const t = await getBackendTranslations({ locale, namespace: "session" });
  const classType = instance.classType as ClassType;
  const courseName = t(`classTypes.${classType}`);

  const start = instance.scheduledStartAt;
  const end = instance.scheduledEndAt;
  const studentTimezone = await SchedulingRepository.resolveStudentTimezone(instance.studentId);
  const teacherTimezone = instance.teacher?.timezone ?? null;
  const hasTimezoneMismatch =
    teacherTimezone !== null && studentTimezone !== null && teacherTimezone !== studentTimezone;

  return {
    id: instance.id,
    courseName,
    classType,
    instanceId: instance.id,
    scheduledDate: start.toISOString().split("T")[0],
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: instance.durationMinutes,
    status: instance.outcome || instance.executionState,
    remarks: instance.remarks ?? null,
    hasTimezoneMismatch,
    studentTimezone,
    zoomMeetingUrl: instance.zoomMeetingUrl ?? null,
    payrollCredited: instance.payrollCredited ?? false,
    isRescheduled: instance.isRescheduled ?? false,
    executionState: instance.executionState,
    outcome: instance.outcome || "PENDING",
    student: {
      id: instance.student?.id || instance.studentId,
      name: instance.student?.name || "Unknown",
      grade: null,
      level: null,
      avatarUrl: instance.student?.avatarUrl ?? null,
    },
    teacher: {
      id: instance.teacher?.id || instance.teacherId,
      name: instance.teacher?.user?.name || "Unknown",
      title: truncateQualifications(instance.teacher?.qualifications),
      avatarUrl: instance.teacher?.user?.avatarUrl ?? null,
    },
    performance: perf
      ? {
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
        }
      : null,
  };
}

/**
 * Shared helper to resolve class instance details by ID for an authenticated user.
 */
export async function resolveDetail(
  userId: string,
  classInstanceId: string,
  locale?: string
): Promise<ClassInstanceDetailReturnType> {
  const { ClassSessionService } = await import("@/backend/services/session/class-session.service");
  return ClassSessionService.getClassInstanceDetail(userId, classInstanceId, locale);
}
