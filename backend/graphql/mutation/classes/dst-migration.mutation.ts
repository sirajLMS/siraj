import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DstMigrationReportPothosObject } from "@/backend/graphql/pothos/classes/dst-migration.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { DstMigrationService } from "@/backend/services";

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
      const tErrors = ctx.t().errorsTranslations;
      return DstMigrationService.executeBulkDstUpdate(userId, args.offsetMinutes, args.description, tErrors);
    },
  })
);
