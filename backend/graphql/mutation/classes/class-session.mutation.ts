import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassInstanceDetailPothosObject,
  LeaveProcessResultPothosObject,
  RescheduleClassInputPothosObject,
} from "@/backend/graphql/pothos/classes/class-session.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { type ClassActionFn, ClassSessionService } from "@/backend/services/session/class-session.service";

async function handleClassAction<R>(ctx: BaseContext, classInstanceId: string, action: ClassActionFn<R>) {
  const userId = await requireAuth(ctx);
  const tErrors = await ctx.t("errors");
  const tSession = await ctx.t("session");
  await action(userId, classInstanceId, tErrors);
  return ClassSessionService.getClassInstanceDetail(userId, classInstanceId, tSession, tErrors);
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
      const tErrors = await ctx.t("errors");
      const result = await ClassSessionService.updateStatusLeave(
        userId,
        args.classInstanceId,
        tErrors,
        args.leaveReason
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
      const tErrors = await ctx.t("errors");
      const tSession = await ctx.t("session");
      const newInstance = await ClassSessionService.reschedule(
        userId,
        args.classInstanceId,
        {
          scheduledStartAt: new Date(args.input.scheduledStartAt),
          scheduledEndAt: new Date(args.input.scheduledEndAt),
          durationMinutes: args.input.durationMinutes,
        },
        tSession,
        tErrors
      );
      return ClassSessionService.getClassInstanceDetail(userId, newInstance.id, tSession, tErrors);
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
      const tErrors = await ctx.t("errors");
      await ClassSessionService.reset(userId, args.classInstanceId, tErrors);
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
      const tErrors = await ctx.t("errors");
      return ClassSessionService.deleteInstance(userId, args.classInstanceId, tErrors);
    },
  })
);
