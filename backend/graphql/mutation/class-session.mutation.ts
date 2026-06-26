import { getBackendTranslations } from "@/backend/lib/intl";
import { type ClassActionFn, ClassSessionService } from "@/backend/services/session/class-session.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ClassInstanceDetailPothosObject,
  LeaveProcessResultPothosObject,
  RescheduleClassInputPothosObject,
} from "../pothos/class-session.pothos";

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
  return ClassSessionService.getClassInstanceDetail(userId, classInstanceId, ctx.locale);
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

gqlSchemaBuilder.mutationField("activateOverrideClass", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) => handleClassAction(ctx, args.classInstanceId, ClassSessionService.activateOverride),
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

gqlSchemaBuilder.mutationField("updateSessionStatusStart", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) =>
      handleClassAction(ctx, args.classInstanceId, ClassSessionService.updateStatusStart),
  })
);

gqlSchemaBuilder.mutationField("updateSessionStatusAbsent", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: (_parent, args, ctx) =>
      handleClassAction(ctx, args.classInstanceId, ClassSessionService.updateStatusAbsent),
  })
);

gqlSchemaBuilder.mutationField("updateSessionStatusLeave", t =>
  t.field({
    type: LeaveProcessResultPothosObject,
    args: {
      classInstanceId: t.arg.id({ required: true }),
      leaveReason: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await ClassSessionService.updateStatusLeave(
        userId,
        args.classInstanceId,
        args.leaveReason,
        ctx.locale
      );
      return {
        id: `${result.originalId}:${result.successorId}`,
        completedInstanceId: result.originalId,
        rescheduledInstanceId: result.successorId,
      };
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
      const userId = await requireAuth(ctx);
      const newInstance = await ClassSessionService.reschedule(
        userId,
        args.classInstanceId,
        {
          scheduledStartAt: new Date(args.input.scheduledStartAt),
          scheduledEndAt: new Date(args.input.scheduledEndAt),
          durationMinutes: args.input.durationMinutes,
        },
        ctx.locale
      );
      return ClassSessionService.getClassInstanceDetail(userId, newInstance.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("resetClass", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await ClassSessionService.reset(userId, args.classInstanceId, ctx.locale);
      return true;
    },
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
