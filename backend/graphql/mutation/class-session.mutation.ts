import { ClassPerformanceRepository } from "@/backend/db/repo/class-performance.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  type ClassInstanceDetailDefinition,
  ClassInstanceDetailPothosObject,
  RescheduleClassInputPothosObject,
} from "../pothos/class-session.pothos";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

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

async function resolveDetail(classInstanceId: string): Promise<ClassInstanceDetailDefinition> {
  const instance = await SchedulingRepository.getClassInstanceById(classInstanceId);
  if (!instance) throw new Error("Not found");
  const perf = await ClassPerformanceRepository.getByClassInstanceId(classInstanceId);
  return buildClassInstanceDetail(instance, perf);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("activateClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.activate(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("forceActivateClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.forceActivate(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("stopClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.stop(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("startClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.start(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("markClassAbsent", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.markAbsent(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("requestClassLeave", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: {
      classInstanceId: t.arg.id({ required: true }),
      reason: t.arg.string({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.requestLeave(ctx.user.id, args.classInstanceId, args.reason ?? null, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("adminExcuseClassLeave", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.adminLeave(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("rescheduleClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: {
      classInstanceId: t.arg.id({ required: true }),
      input: t.arg({ type: RescheduleClassInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const existing = await SchedulingRepository.getClassInstanceById(args.classInstanceId);
      if (!existing) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("notFound"));
      }
      const newInstance = await ClassSessionService.reschedule(
        ctx.user.id,
        args.classInstanceId,
        {
          studentId: existing.studentId,
          teacherId: existing.teacherId,
          scheduledStartAt: new Date(args.input.scheduledStartAt),
          scheduledEndAt: new Date(args.input.scheduledEndAt),
          durationMinutes: args.input.durationMinutes,
          classType: existing.classType,
          executionState: existing.executionState,
          outcome: existing.outcome,
          idempotencyKey: existing.idempotencyKey,
        },
        ctx.locale
      );
      return resolveDetail(newInstance.id);
    },
  })
);

gqlSchemaBuilder.mutationField("revertClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      await ClassSessionService.revert(ctx.user.id, args.classInstanceId, ctx.locale);
      return resolveDetail(args.classInstanceId);
    },
  })
);

gqlSchemaBuilder.mutationField("deleteClassInstance", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ClassSessionService.deleteInstance(ctx.user.id, args.classInstanceId, ctx.locale);
    },
  })
);
