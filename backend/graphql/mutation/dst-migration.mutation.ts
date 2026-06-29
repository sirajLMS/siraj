import { getBackendTranslations } from "@/backend/lib/intl";
import { DstMigrationService } from "@/backend/services/system/dst-migration.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { DstMigrationReportPothosObject } from "../pothos/dst-migration.pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

gqlSchemaBuilder.mutationField("executeDstBulkUpdate", t =>
  t.field({
    type: DstMigrationReportPothosObject,
    args: {
      offsetMinutes: t.arg.int({ required: true }),
      description: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return DstMigrationService.executeBulkDstUpdate(userId, args.offsetMinutes, args.description, ctx.locale);
    },
  })
);
