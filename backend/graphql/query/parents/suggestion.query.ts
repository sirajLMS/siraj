// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AdminSuggestionResultPothosObject,
  normalizeSuggestion,
  normalizeSuggestionSearchResult,
  ParentSuggestionOptionsPothosObject,
  requireAuth,
  SuggestionContributorStatsPothosObject,
  SuggestionFilterPothosObject,
  SuggestionPothosObject,
  SuggestionSearchResultPothosObject,
} from "@/backend/graphql/pothos/parents/suggestion.pothos";
import { SuggestionService } from "@/backend/services";
import type { SuggestionQueueResult } from "@/backend/types";

gqlSchemaBuilder.queryField("adminSuggestions", t =>
  t.field({
    type: AdminSuggestionResultPothosObject,
    authScopes: { superAdmin: true },
    description: "Returns the paginated admin suggestion list with metrics.",
    args: {
      filter: t.arg({ type: SuggestionFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireAuth(ctx);

      const result: SuggestionQueueResult = await SuggestionService.getAdminSuggestions(
        userId,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
          status: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        ctx.locale
      );

      return {
        id: result.id,
        suggestions: result.suggestions.map(normalizeSuggestion),
        metrics: result.metrics,
      };
    },
  })
);

gqlSchemaBuilder.queryField("parentSuggestions", t =>
  t.field({
    type: [SuggestionPothosObject],
    description: "Returns the authenticated parent's suggestion history with review status.",
    authScopes: { loggedIn: true },
    args: {
      options: t.arg({ type: ParentSuggestionOptionsPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireAuth(ctx);

      const suggestions = await SuggestionService.getParentSuggestions(
        userId,
        { limit: args.options.limit, offset: args.options.offset },
        ctx.locale
      );

      return suggestions.map(normalizeSuggestion);
    },
  })
);

gqlSchemaBuilder.queryField("searchSuggestions", t =>
  t.field({
    type: [SuggestionSearchResultPothosObject],
    description: "Search suggestions for duplicate marking autocomplete. Requires suggestions.review permission.",
    authScopes: { permission: AppPermission.SUGGESTIONS_REVIEW },
    args: {
      query: t.arg.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      excludeId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireAuth(ctx);

      const results = await SuggestionService.searchSuggestions(userId, args.query, args.excludeId, ctx.locale);
      return results.map(normalizeSuggestionSearchResult);
    },
  })
);

gqlSchemaBuilder.queryField("suggestionContributorStats", t =>
  t.field({
    type: SuggestionContributorStatsPothosObject,
    description: "Returns contributor statistics for the suggestion social proof display.",
    authScopes: { loggedIn: true },
    args: {
      days: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireAuth(ctx);
      return SuggestionService.getContributorStats(userId, args.days, ctx.locale);
    },
  })
);
