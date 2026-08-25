// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { LearningResourceRowPothosObject } from "@/backend/graphql/pothos/storage/learning-resource.pothos";
import { LearningResourceService } from "@/backend/services";

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
