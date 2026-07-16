import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ScheduleDeletionService } from "@/backend/services/schedule/schedule-deletion.service";

gqlSchemaBuilder.mutationField("deleteRecurringClass", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { superAdmin: true, notImpersonating: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ScheduleDeletionService.deleteClass(userId, args.classInstanceId, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("clearWeeklySchedule", t =>
  t.field({
    type: "Boolean",
    args: { teacherId: t.arg.id({ required: true }) },
    authScopes: { superAdmin: true, notImpersonating: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return ScheduleDeletionService.clearWeeklySchedule(userId, args.teacherId, tErrors);
    },
  })
);
