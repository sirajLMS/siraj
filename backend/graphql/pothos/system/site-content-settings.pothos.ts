import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SiteContentValidationError } from "@/backend/services";
import type { SiteContentSelectType, SiteContentUpsertGraphQLInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export function handleSiteContentServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof SiteContentValidationError && error.code === "ESLUG_INVALID") {
    throw new GraphQLError(tErrors.invalidInput, {
      extensions: { code: "ESLUG_INVALID" },
    });
  }

  throw error;
}

export const SiteContentEntryRef = gqlSchemaBuilder.objectRef<SiteContentSelectType>("SiteContentEntry");

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

export const SiteContentUpsertInputRef =
  gqlSchemaBuilder.inputRef<SiteContentUpsertGraphQLInput>("SiteContentUpsertInput");

export const SiteContentUpsertInputPothosObject = SiteContentUpsertInputRef.implement({
  fields: t => ({
    slug: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    title: t.string({ required: true, directives: { constraint: { maxLength: 200 } } }),
    body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    contentType: t.string({ required: true, directives: { constraint: { maxLength: 50 } } }),
    isPublished: t.boolean({ required: true }),
  }),
});

export function canViewSiteContentSettings(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_SITE_CONTENT_MANAGE)
  );
}

export function assertCanViewSiteContentSettings(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewSiteContentSettings(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
