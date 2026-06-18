import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { type ClassActionFn, ClassSessionService } from "@/backend/services/session/class-session.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassInstanceDetailPothosObject, RescheduleClassInputPothosObject } from "../pothos/class-session.pothos";
import { resolveDetail } from "../utils/class-session.utils";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

async function handleClassAction<R>(ctx: BaseContext, classInstanceId: string, action: ClassActionFn<R>) {
  const userId = await requireAuth(ctx);
  await action(userId, classInstanceId, ctx.locale);
  return resolveDetail(classInstanceId);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("activateClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.activate),
  })
);

gqlSchemaBuilder.mutationField("forceActivateClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.forceActivate),
  })
);

gqlSchemaBuilder.mutationField("stopClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.stop),
  })
);

gqlSchemaBuilder.mutationField("startClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.start),
  })
);

gqlSchemaBuilder.mutationField("markClassAbsent", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.markAbsent),
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
    resolve: (_parent, args, ctx) =>
      handleClassAction(ctx, args.classInstanceId, (userId, id, locale) =>
        ClassSessionService.requestLeave(userId, id, args.reason ?? null, locale)
      ),
  })
);

gqlSchemaBuilder.mutationField("adminExcuseClassLeave", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.adminLeave),
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
      const userId = await requireAuth(ctx);
      const existing = await SchedulingRepository.getClassInstanceById(args.classInstanceId);
      if (!existing) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("notFound"));
      }
      const newInstance = await ClassSessionService.reschedule(
        userId,
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
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.revert),
  })
);

gqlSchemaBuilder.mutationField("deleteClassInstance", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ClassSessionService.deleteInstance(userId, args.classInstanceId, ctx.locale);
    },
  })
);
