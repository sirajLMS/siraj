import { DstMigrationService } from "@/backend/services/system/dst-migration.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { DstMigrationReportPothosObject } from "../pothos/dst-migration.pothos";
import { requireAuth } from "../utils/requireAuth";

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
