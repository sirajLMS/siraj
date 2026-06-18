import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { TeacherDashboardService } from "@/backend/services/teacher/teacher-dashboard.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassInstanceDetailPothosObject, SupportRequestResultPothosObject } from "../pothos/class-session.pothos";
import {
  CreateManualClassEntryInputPothosObject,
  LogSupportRequestInputPothosObject,
} from "../pothos/teacher-dashboard.pothos";

// ─── Shared helper ────────────────────────────────────────────────────────────

async function resolveDetail(classInstanceId: string) {
  const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
  if (!instance) throw new Error("Not found");
  const perf = await ClassPerformanceRepository.getByClassInstanceId(classInstanceId);
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

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("createTeacherManualClassEntry", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: {
      input: t.arg({ type: CreateManualClassEntryInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const created = await TeacherDashboardService.createManualEntry(
        ctx.user.id,
        {
          studentId: args.input.studentId,
          teacherId: args.input.teacherId,
          scheduledStartAt: args.input.scheduledStartAt,
          scheduledEndAt: args.input.scheduledEndAt,
          durationMinutes: args.input.durationMinutes,
          classType: (args.input.classType as "REGULAR" | "TRIAL" | "PROMOTION" | undefined) ?? undefined,
        },
        ctx.locale
      );
      return resolveDetail(created.id);
    },
  })
);

gqlSchemaBuilder.mutationField("logTeacherSupportRequest", t =>
  t.field({
    type: SupportRequestResultPothosObject,
    args: {
      input: t.arg({ type: LogSupportRequestInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const result = await TeacherDashboardService.logSupportRequest(
        ctx.user.id,
        { reason: args.input.reason },
        ctx.locale
      );
      return { id: result.id, success: true };
    },
  })
);
