import { GraphQLError } from "graphql";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { LearningResourceService } from "@/backend/services";
import type { LearningResourceReturnType } from "@/backend/types";

// ─── Input Types ──────────────────────────────────────────────────────────────

const ResourceUploadInput = gqlSchemaBuilder.inputType("ResourceUploadInput", {
  fields: t => ({
    displayName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    filePath: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    fileId: t.id({ required: true }),
  }),
});

// ─── Object Types ─────────────────────────────────────────────────────────────

const LearningResourceRowRef = gqlSchemaBuilder.objectRef<LearningResourceReturnType>("LearningResourceRow");

export const LearningResourceRowPothosObject = LearningResourceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    displayName: t.exposeString("displayName"),
    filePath: t.exposeString("filePath"),
    uploadedByUserId: t.exposeString("uploadedByUserId"),
    uploadedByUserName: t.exposeString("uploadedByUserName", { nullable: true }),
    fileSize: t.exposeFloat("fileSize", { nullable: true }),
    contentType: t.exposeString("contentType", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Queries & Mutations ─────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("learningResources", t =>
  t.field({
    type: [LearningResourceRowPothosObject],
    authScopes: { loggedIn: true },
    args: {
      searchQuery: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const locale = ctx.locale ?? "en";
      const userId = requireUserId(ctx);

      const result = await LearningResourceService.listResources(userId, args.searchQuery ?? undefined, locale);

      return result.rows;
    },
    description: "Lists all learning resources available to the academy.",
  })
);

gqlSchemaBuilder.mutationField("uploadLearningResource", t =>
  t.field({
    type: LearningResourceRowPothosObject,
    authScopes: { superAdmin: true },
    args: {
      input: t.arg({ type: ResourceUploadInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const locale = ctx.locale ?? "en";
      const userId = requireUserId(ctx);

      return await LearningResourceService.createResource(userId, args.input, locale);
    },
    description: "Uploads a new learning resource to the academy library.",
  })
);

/**
 * Mutation: deleteLearningResource
 * Permanently deletes a curriculum file and drops the DB record.
 */
gqlSchemaBuilder.mutationField("deleteLearningResource", t =>
  t.boolean({
    authScopes: { superAdmin: true },
    description: "Permanently deletes a learning resource from physical storage and the database.",
    args: {
      id: t.arg.id({ required: true, description: "The UUID of the resource to delete" }),
    },
    resolve: async (_root, args, ctx) => {
      // 1. Authentication Check
      if (!ctx.user?.id) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }

      // 2. Delegate to Service Layer
      // We pass the stringified ID, the actor's ID, and the locale.
      // The Service Layer handles the RBAC check for 'resources.delete'.
      return LearningResourceService.deleteResource(args.id, ctx.user.id, ctx.locale);
    },
  })
);
