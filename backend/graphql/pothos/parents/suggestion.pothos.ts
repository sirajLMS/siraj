import { GraphQLError } from "graphql";
import { AppPermission, SuggestionStatus } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { authRateLimiter, checkRateLimit } from "@/backend/lib/ratelimit";
import { SuggestionService } from "@/backend/services";
import type {
  DuplicateSuggestionInput,
  ParentSuggestionOptions,
  RespondToSuggestionInput,
  SuggestionContributorStats,
  SuggestionMetrics,
  SuggestionQueueFilter,
  SuggestionQueueResult,
  SuggestionReturnType,
  SuggestionSearchResultType,
  SuggestionSelectType,
  SuggestionSubmitInput,
} from "@/backend/types";

function requireAuth(ctx: Pick<BaseContext, "user" | "t">): string {
  if (!ctx.user?.id) {
    const tErrors = ctx.t().errorsTranslations;
    throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
  }
  return ctx.user.id;
}

function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (Object.values(SuggestionStatus) as readonly string[]).includes(value);
}

const SuggestionStatusPothosEnum = gqlSchemaBuilder.enumType(SuggestionStatus, {
  name: "SuggestionStatus",
  description: "Status of a suggestion in the review pipeline.",
});

const SuggestionRef = gqlSchemaBuilder.objectRef<SuggestionReturnType>("Suggestion");

export const SuggestionPothosObject = SuggestionRef.implement({
  description: "A parent suggestion with full details including review and duplicate status.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: SuggestionStatusPothosEnum }),
    duplicateOfId: t.exposeString("duplicateOfId", { nullable: true }),
    adminResponse: t.exposeString("adminResponse", { nullable: true }),
    reviewedByUserId: t.exposeString("reviewedByUserId", { nullable: true }),
    reviewedAt: t.expose("reviewedAt", { type: "DateTime", nullable: true }),
    emailSentAt: t.expose("emailSentAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName", { nullable: true }),
    parentUserId: t.exposeString("parentUserId", { nullable: true }),
    reviewedByName: t.field({
      type: "String",
      nullable: true,
      resolve: suggestion => suggestion.reviewedByUserName ?? null,
    }),
    duplicateOfBody: t.exposeString("duplicateOfBody", { nullable: true }),
    duplicateOfSubmitterName: t.exposeString("duplicateOfSubmitterName", { nullable: true }),
    responseCount: t.exposeInt("responseCount", { nullable: true }),
  }),
});

const SuggestionMetricsRef = gqlSchemaBuilder.objectRef<SuggestionMetrics>("SuggestionMetrics");

export const SuggestionMetricsPothosObject = SuggestionMetricsRef.implement({
  description: "Aggregate metrics for the suggestion queue.",
  fields: t => ({
    id: t.exposeString("id"),
    pending: t.exposeInt("pending"),
    reviewed: t.exposeInt("reviewed"),
    duplicate: t.exposeInt("duplicate"),
    avgResponseTime: t.exposeString("avgResponseTime", { nullable: true }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const AdminSuggestionResultRef = gqlSchemaBuilder.objectRef<SuggestionQueueResult>("AdminSuggestionResult");

export const AdminSuggestionResultPothosObject = AdminSuggestionResultRef.implement({
  description: "Paginated admin suggestion list with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    suggestions: t.expose("suggestions", { type: [SuggestionPothosObject] }),
    rows: t.expose("suggestions", { type: [SuggestionPothosObject] }),
    metrics: t.expose("metrics", { type: SuggestionMetricsPothosObject }),
  }),
});

const SuggestionSearchResultRef = gqlSchemaBuilder.objectRef<SuggestionSearchResultType>("SuggestionSearchResult");

export const SuggestionSearchResultPothosObject = SuggestionSearchResultRef.implement({
  description: "A lightweight suggestion result for duplicate search autocomplete.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: SuggestionStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
  }),
});

const SuggestionContributorRef =
  gqlSchemaBuilder.objectRef<SuggestionContributorStats["contributors"][number]>("SuggestionContributor");

export const SuggestionContributorPothosObject = SuggestionContributorRef.implement({
  description: "A parent who recently submitted suggestions.",
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    suggestionCount: t.exposeInt("suggestionCount"),
  }),
});

const SuggestionContributorStatsRef =
  gqlSchemaBuilder.objectRef<SuggestionContributorStats>("SuggestionContributorStats");

export const SuggestionContributorStatsPothosObject = SuggestionContributorStatsRef.implement({
  description: "Statistics about recent suggestion contributors.",
  fields: t => ({
    id: t.exposeString("id"),
    uniqueContributorCount: t.exposeInt("uniqueContributorCount"),
    contributors: t.expose("contributors", { type: [SuggestionContributorPothosObject] }),
  }),
});

export const SubmitSuggestionInputPothosObject = gqlSchemaBuilder
  .inputRef<SuggestionSubmitInput>("SubmitSuggestionInput")
  .implement({
    description: "Input for submitting a new suggestion.",
    fields: t => ({
      submitterName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
      body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    }),
  });

export const SuggestionFilterPothosObject = gqlSchemaBuilder
  .inputRef<SuggestionQueueFilter>("SuggestionFilter")
  .implement({
    description: "Filter and pagination options for the admin suggestion list.",
    fields: t => ({
      search: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      status: t.field({ type: SuggestionStatusPothosEnum, required: false }),
      limit: t.int({ required: true, directives: { constraint: { max: 100 } } }),
      offset: t.int({ required: true, directives: { constraint: { min: 0, max: 1000000 } } }),
    }),
  });

export const ParentSuggestionOptionsPothosObject = gqlSchemaBuilder
  .inputRef<ParentSuggestionOptions>("ParentSuggestionOptions")
  .implement({
    description: "Pagination options for the parent suggestions history query.",
    fields: t => ({
      limit: t.int({ required: true, directives: { constraint: { max: 100 } } }),
      offset: t.int({ required: true, directives: { constraint: { min: 0, max: 1000000 } } }),
    }),
  });

export const RespondToSuggestionInputPothosObject = gqlSchemaBuilder
  .inputRef<RespondToSuggestionInput>("RespondToSuggestionInput")
  .implement({
    description: "Input for responding to a suggestion with an admin response.",
    fields: t => ({
      suggestionId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      adminResponse: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
    }),
  });

export const MarkSuggestionDuplicateInputPothosObject = gqlSchemaBuilder
  .inputRef<DuplicateSuggestionInput>("MarkSuggestionDuplicateInput")
  .implement({
    description: "Input for marking a suggestion as a duplicate of another suggestion.",
    fields: t => ({
      suggestionId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      duplicateOfId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    }),
  });

function normalizeSuggestion(suggestion: SuggestionReturnType): SuggestionReturnType {
  return {
    ...suggestion,
    parentName: suggestion.parentName ?? null,
    reviewedByUserName: suggestion.reviewedByUserName ?? null,
    duplicateOfBody: suggestion.duplicateOfBody ?? null,
    duplicateOfSubmitterName: suggestion.duplicateOfSubmitterName ?? null,
    responseCount: suggestion.responseCount ?? 0,
  };
}

function normalizeSuggestionSearchResult(result: SuggestionSearchResultType): SuggestionSearchResultType {
  return {
    ...result,
    parentName: result.parentName ?? "",
  };
}

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

function toSuggestionReturnType(result: SuggestionSelectType): SuggestionReturnType {
  return normalizeSuggestion({
    id: result.id,
    parentId: result.parentId,
    submitterName: result.submitterName,
    body: result.body,
    status: isSuggestionStatus(result.status) ? result.status : SuggestionStatus.PENDING,
    duplicateOfId: result.duplicateOfId ?? null,
    adminResponse: result.adminResponse ?? null,
    reviewedByUserId: result.reviewedByUserId ?? null,
    reviewedAt: result.reviewedAt ?? null,
    emailSentAt: result.emailSentAt ?? null,
    createdAt: result.createdAt,
    parentName: "",
    reviewedByUserName: null,
    duplicateOfBody: null,
    duplicateOfSubmitterName: null,
    responseCount: 0,
  });
}

async function authenticatedSuggestionMutation(
  ctx: Pick<BaseContext, "user" | "t" | "locale">,
  serviceCall: (userId: string) => Promise<SuggestionSelectType>
): Promise<SuggestionReturnType> {
  const userId = requireAuth(ctx);
  const result = await serviceCall(userId);
  return toSuggestionReturnType(result);
}

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
