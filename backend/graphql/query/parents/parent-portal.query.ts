import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ParentAssignedStudentsResultPothosObject,
  ParentHandbookUrlPothosObject,
  ParentOwnProfilePothosObject,
} from "@/backend/graphql/pothos/parents/parent-portal.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ParentPortalService, SystemSettingsService } from "@/backend/services";

gqlSchemaBuilder.queryField("parentAssignedStudents", t =>
  t.field({
    type: ParentAssignedStudentsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return ParentPortalService.listAssignedStudents(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentOwnProfile", t =>
  t.field({
    type: ParentOwnProfilePothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return ParentPortalService.getOwnProfile(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentHandbookUrl", t =>
  t.field({
    type: ParentHandbookUrlPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const url = await SystemSettingsService.getParentHandbookDownloadUrl(userId, tErrors);
      return { id: `parent-handbook-${userId}`, url };
    },
  })
);
