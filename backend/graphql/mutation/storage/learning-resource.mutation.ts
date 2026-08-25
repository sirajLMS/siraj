// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  LearningResourceRowPothosObject,
  ResourceUploadInput,
} from "@/backend/graphql/pothos/storage/learning-resource.pothos";
import { LearningResourceService } from "@/backend/services";

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
