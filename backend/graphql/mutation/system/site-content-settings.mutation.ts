// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  handleSiteContentServiceError,
  SiteContentEntryPothosObject,
  SiteContentUpsertInputPothosObject,
} from "@/backend/graphql/pothos/system/site-content-settings.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SiteContentService } from "@/backend/services";

gqlSchemaBuilder.mutationField("upsertSiteContent", t =>
  t.field({
    type: SiteContentEntryPothosObject,
    authScopes: {
      $all: {
        permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
        notImpersonating: true,
      },
    },
    args: {
      input: t.arg({ type: SiteContentUpsertInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      try {
        return await SiteContentService.upsertSiteContent({ ...args.input, updatedByUserId: userId }, userId, tErrors);
      } catch (error) {
        handleSiteContentServiceError(error, tErrors);
      }
      return undefined;
    },
    description: "Creates or updates a site content entry by slug.",
  })
);

gqlSchemaBuilder.mutationField("updateSiteContentPublishState", t =>
  t.field({
    type: SiteContentEntryPothosObject,
    authScopes: {
      $all: {
        permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
        notImpersonating: true,
      },
    },
    args: {
      id: t.arg.id({ required: true }),
      isPublished: t.arg.boolean({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      const result = await SiteContentService.updatePublishState(args.id, args.isPublished, userId, tErrors);

      if (!result) {
        throw new GraphQLError(tErrors.notFound, {
          extensions: { code: "NOT_FOUND" },
        });
      }

      return result;
    },
    description: "Updates the published state of a site content entry.",
  })
);

gqlSchemaBuilder.mutationField("deleteSiteContent", t =>
  t.field({
    type: "Boolean",
    authScopes: {
      $all: {
        permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
        notImpersonating: true,
      },
    },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      await SiteContentService.deleteSiteContentById(args.id, userId, tErrors);

      return true;
    },
    description: "Permanently deletes a site content entry.",
  })
);
