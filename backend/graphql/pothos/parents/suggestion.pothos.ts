import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SuggestionStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
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
  SuggestionSubmitInput,
} from "@/backend/types";

export const SuggestionRef = gqlSchemaBuilder.objectRef<SuggestionReturnType>("Suggestion");

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

export const SuggestionMetricsRef = gqlSchemaBuilder.objectRef<SuggestionMetrics>("SuggestionMetrics");

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

export const AdminSuggestionResultRef = gqlSchemaBuilder.objectRef<SuggestionQueueResult>("AdminSuggestionResult");

export const AdminSuggestionResultPothosObject = AdminSuggestionResultRef.implement({
  description: "Paginated admin suggestion list with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    suggestions: t.expose("suggestions", { type: [SuggestionPothosObject] }),
    rows: t.expose("suggestions", { type: [SuggestionPothosObject] }),
    metrics: t.expose("metrics", { type: SuggestionMetricsPothosObject }),
  }),
});

export const SuggestionSearchResultRef =
  gqlSchemaBuilder.objectRef<SuggestionSearchResultType>("SuggestionSearchResult");

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

export const SuggestionContributorRef =
  gqlSchemaBuilder.objectRef<SuggestionContributorStats["contributors"][number]>("SuggestionContributor");

export const SuggestionContributorPothosObject = SuggestionContributorRef.implement({
  description: "A parent who recently submitted suggestions.",
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    suggestionCount: t.exposeInt("suggestionCount"),
  }),
});

export const SuggestionContributorStatsRef =
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
