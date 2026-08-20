import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SiteContentService, SiteContentValidationError } from "@/backend/services";
import type { SiteContentSelectType, SiteContentUpsertGraphQLInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

function handleSiteContentServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof SiteContentValidationError && error.code === "ESLUG_INVALID") {
    throw new GraphQLError(tErrors.invalidInput, {
      extensions: { code: "ESLUG_INVALID" },
    });
  }

  throw error;
}

const SiteContentEntryRef = gqlSchemaBuilder.objectRef<SiteContentSelectType>("SiteContentEntry");

export const SiteContentEntryPothosObject = SiteContentEntryRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    slug: t.exposeString("slug"),
    title: t.exposeString("title"),
    body: t.exposeString("body"),
    contentType: t.exposeString("contentType"),
    isPublished: t.exposeBoolean("isPublished"),
    updatedByUserId: t.exposeString("updatedByUserId", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const SiteContentUpsertInputRef = gqlSchemaBuilder.inputRef<SiteContentUpsertGraphQLInput>("SiteContentUpsertInput");

export const SiteContentUpsertInputPothosObject = SiteContentUpsertInputRef.implement({
  fields: t => ({
    slug: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    title: t.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
    body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    contentType: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
    isPublished: t.boolean({ required: true }),
  }),
});

function canViewSiteContentSettings(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_SITE_CONTENT_MANAGE)
  );
}

function assertCanViewSiteContentSettings(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewSiteContentSettings(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

gqlSchemaBuilder.queryField("siteContentEntries", t =>
  t.field({
    type: [SiteContentEntryPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSiteContentSettings(ctx, tErrors);
      return SiteContentService.listSiteContent();
    },
    description: "Lists all site content entries for the Settings CMS tab.",
  })
);

gqlSchemaBuilder.queryField("siteContentEntry", t =>
  t.field({
    type: SiteContentEntryPothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSiteContentSettings(ctx, tErrors);
      return SiteContentService.getSiteContentById(args.id);
    },
    description: "Fetches a single site content entry by ID.",
  })
);

gqlSchemaBuilder.mutationField("upsertSiteContent", t =>
  t.field({
    type: SiteContentEntryPothosObject,
    authScopes: {
      permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
      notImpersonating: true,
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
      permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
      notImpersonating: true,
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
      permission: AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
      notImpersonating: true,
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
