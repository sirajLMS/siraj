// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SupportRequestResultPothosObject } from "@/backend/graphql/pothos/classes/class-session.pothos";
import { GroupClassAuditRef } from "@/backend/graphql/pothos/classes/group-class.pothos";
import { requireAuthWithRateLimit } from "@/backend/graphql/shared";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { GroupClassService } from "@/backend/services";

gqlSchemaBuilder.mutationField("updateClassAdminNote", t =>
  t.field({
    type: GroupClassAuditRef,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      content: t.arg.string({ required: true, directives: { constraint: { maxLength: 10000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return GroupClassService.updateAdminNote(userId, args.classInstanceId, args.content, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("resendClassNotifications", t =>
  t.field({
    type: SupportRequestResultPothosObject,
    authScopes: { superAdmin: true },
    args: {
      classInstanceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { userId, tErrors } = await requireAuthWithRateLimit(ctx);
      return GroupClassService.resendNotifications(userId, args.classInstanceId, tErrors);
    },
  })
);
