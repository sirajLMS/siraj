import { ParentPortalService } from "@/backend/services/parent/parent-portal.service";
import { SystemSettingsService } from "@/backend/services/system/system-settings.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  ParentAssignedStudentsResultPothosObject,
  ParentHandbookUrlPothosObject,
  ParentOwnProfilePothosObject,
} from "../pothos/parent-portal.pothos";
import { requireAuth } from "../utils/requireAuth";

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
      const url = await SystemSettingsService.getParentHandbookDownloadUrl(userId, ctx.locale);
      return { id: `parent-handbook-${userId}`, url };
    },
  })
);
