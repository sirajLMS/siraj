// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { GroupClassAuditRef } from "@/backend/graphql/pothos/classes/group-class.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { GroupClassService } from "@/backend/services";

gqlSchemaBuilder.queryField("groupClassAudit", t =>
  t.field({
    type: GroupClassAuditRef,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return GroupClassService.getGroupClassAudit(userId, args.classInstanceId, tErrors);
    },
  })
);
