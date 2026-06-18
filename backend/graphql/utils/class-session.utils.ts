import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import type { ClassInstanceDetailDefinition } from "../pothos/class-session.pothos";

/**
 * Shared helper to build a ClassInstanceDetailDefinition from database entities.
 */
export function buildClassInstanceDetail(
  instance: NonNullable<Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceById>>>,
  perf: Awaited<ReturnType<typeof ClassPerformanceRepository.getByClassInstanceId>>
): ClassInstanceDetailDefinition {
  const start = instance.scheduledStartAt;
  const end = instance.scheduledEndAt;
  return {
    id: instance.id,
    courseName: "Class Session",
    instanceId: instance.id,
    scheduledDate: start.toISOString().split("T")[0],
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    durationMinutes: instance.durationMinutes,
    status: instance.outcome || instance.executionState,
    remarks: instance.remarks ?? null,
    hasTimezoneMismatch: false,
    studentTimezone: null,
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
      avatarUrl: null,
    },
    teacher: {
      id: instance.teacher?.id || instance.teacherId,
      name: instance.teacher?.user?.name || "Unknown",
      title: null,
      avatarUrl: null,
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
          attendanceRate: perf.attendanceRate ?? null,
          avgGrade: perf.avgGrade ?? null,
          lastClassDaysAgo: perf.lastClassDaysAgo ?? null,
        }
      : null,
  };
}

/**
 * Shared helper to resolve class instance details by ID.
 */
export async function resolveDetail(classInstanceId: string, locale?: string): Promise<ClassInstanceDetailDefinition> {
  const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
  if (!instance) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }
  const perf = await ClassPerformanceRepository.getByClassInstanceId(classInstanceId);
  return buildClassInstanceDetail(instance, perf);
}
