// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  authenticatedSuggestionMutation,
  MarkSuggestionDuplicateInputPothosObject,
  RespondToSuggestionInputPothosObject,
  requireAuth,
  SubmitSuggestionInputPothosObject,
  SuggestionPothosObject,
} from "@/backend/graphql/pothos/parents/suggestion.pothos";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import { SuggestionService } from "@/backend/services";

gqlSchemaBuilder.mutationField("submitSuggestion", t =>
  t.field({
    type: SuggestionPothosObject,
    authScopes: { loggedIn: true },
    description: "Submits a new suggestion from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitSuggestionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) =>
      authenticatedSuggestionMutation(ctx, userId =>
        SuggestionService.submitSuggestion(
          userId,
          { submitterName: args.input.submitterName, body: args.input.body },
          ctx.locale
        )
      ),
  })
);

gqlSchemaBuilder.mutationField("markSuggestionReviewed", t =>
  t.field({
    type: SuggestionPothosObject,
    authScopes: { superAdmin: true },
    description: "Marks a suggestion as reviewed (admin only).",
    args: {
      suggestionId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) =>
      authenticatedSuggestionMutation(ctx, userId =>
        SuggestionService.markSuggestionReviewed(userId, args.suggestionId, ctx.locale)
      ),
  })
);

gqlSchemaBuilder.mutationField("respondToSuggestion", t =>
  t.field({
    type: SuggestionPothosObject,
    authScopes: { superAdmin: true },
    description: "Responds to a suggestion with an admin text response (admin only).",
    args: {
      input: t.arg({ type: RespondToSuggestionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const rateLimitResult = await checkRateLimit(ctx.ipAddress ?? "[unknown]", authRateLimiter);
      if (!rateLimitResult.success) {
        throw new GraphQLError(tErrors.auth.tooManyLoginAttempts, {
          extensions: { code: "TOO_MANY_ATTEMPTS" },
        });
      }
      return authenticatedSuggestionMutation(ctx, userId =>
        SuggestionService.respondToSuggestion(userId, args.input.suggestionId, args.input.adminResponse, ctx.locale)
      );
    },
  })
);

gqlSchemaBuilder.mutationField("markSuggestionDuplicate", t =>
  t.field({
    type: SuggestionPothosObject,
    authScopes: { superAdmin: true },
    description: "Marks a suggestion as a duplicate of another suggestion (admin only).",
    args: {
      input: t.arg({ type: MarkSuggestionDuplicateInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) =>
      authenticatedSuggestionMutation(ctx, userId =>
        SuggestionService.markAsDuplicate(userId, args.input.suggestionId, args.input.duplicateOfId, ctx.locale)
      ),
  })
);

gqlSchemaBuilder.mutationField("deleteSuggestion", t =>
  t.field({
    type: "Boolean",
    authScopes: { superAdmin: true },
    description: "Soft-deletes a suggestion (super admin only). Returns true on success.",
    args: {
      suggestionId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = requireAuth(ctx);

      await SuggestionService.deleteSuggestion(userId, args.suggestionId, ctx.locale);
      return true;
    },
  })
);
