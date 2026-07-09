import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { DstMigrationReportPothosObject } from "@/backend/graphql/pothos/dst-migration.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { DstMigrationService } from "@/backend/services/system/dst-migration.service";

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
