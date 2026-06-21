import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleDeletionService } from "@/backend/services/schedule/schedule-deletion.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

gqlSchemaBuilder.mutationField("deleteRecurringClass", t =>
  t.field({
    type: "Boolean",
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
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
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return ScheduleDeletionService.clearWeeklySchedule(userId, args.teacherId, ctx.locale);
    },
  })
);
