import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  type ClassInstanceDetailDefinition,
  ClassInstanceDetailPothosObject,
  ClassStatusEventPothosObject,
} from "../pothos/class-session.pothos";

function buildClassInstanceDetail(
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
          heatmapData: (perf.heatmapData as number[] | null) ?? null,
          latencyMs: perf.latencyMs ?? null,
          attendanceRate: perf.attendanceRate ?? null,
          avgGrade: perf.avgGrade ?? null,
          lastClassDaysAgo: perf.lastClassDaysAgo ?? null,
        }
      : null,
  };
}

gqlSchemaBuilder.queryField("classInstance", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { id: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const instance = await SchedulingRepository.getClassInstanceById(args.id);
      if (!instance) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("notFound"));
      }
      const perf = await ClassPerformanceRepository.getByClassInstanceId(args.id);
      return buildClassInstanceDetail(instance, perf);
    },
  })
);

gqlSchemaBuilder.queryField("classStatusEvents", t =>
  t.field({
    type: [ClassStatusEventPothosObject],
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return SchedulingRepository.getClassStatusEvents(args.classInstanceId);
    },
  })
);
