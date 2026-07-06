import { ScheduleDeletionService } from "@/backend/services/schedule/schedule-deletion.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.mutationField("deleteRecurringClass", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { superAdmin: true, notImpersonating: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ScheduleDeletionService.deleteClass(userId, args.classInstanceId, ctx.locale);
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
      return ScheduleDeletionService.clearWeeklySchedule(userId, args.teacherId, ctx.locale);
    },
  })
);
