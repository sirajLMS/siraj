import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { SuggestionService } from "@/backend/services/communication/suggestion.service";
import type { AdminSuggestionResultType, SubmitSuggestionInputType, SuggestionSelectType } from "@/backend/types";

export type SuggestionPothosType = SuggestionSelectType & {
  parentName: string;
};

const SuggestionRef = gqlSchemaBuilder.objectRef<SuggestionPothosType>("Suggestion");

export const SuggestionPothosObject = SuggestionRef.implement({
  description: "A parent suggestion with full details.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    emailSentAt: t.expose("emailSentAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
  }),
});

export type SuggestionMetricsPothosType = {
  id: string;
  pending: number;
  reviewed: number;
  avgResponseTime: string | null;
};

const SuggestionMetricsRef = gqlSchemaBuilder.objectRef<SuggestionMetricsPothosType>("SuggestionMetrics");

export const SuggestionMetricsPothosObject = SuggestionMetricsRef.implement({
  description: "Aggregate metrics for the suggestion queue.",
  fields: t => ({
    id: t.exposeString("id"),
    pending: t.exposeInt("pending"),
    reviewed: t.exposeInt("reviewed"),
    avgResponseTime: t.exposeString("avgResponseTime", { nullable: true }),
  }),
});

export type AdminSuggestionResultPothosType = {
  id: string;
  rows: ReadonlyArray<SuggestionPothosType>;
  metrics: SuggestionMetricsPothosType;
  totalCount: number;
};

const AdminSuggestionResultRef = gqlSchemaBuilder.objectRef<AdminSuggestionResultPothosType>("AdminSuggestionResult");

export const AdminSuggestionResultPothosObject = AdminSuggestionResultRef.implement({
  description: "Paginated admin suggestion list with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [SuggestionPothosObject] }),
    metrics: t.expose("metrics", { type: SuggestionMetricsPothosObject }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

export type SubmitSuggestionInputPothosType = SubmitSuggestionInputType;

export const SubmitSuggestionInputPothosObject = gqlSchemaBuilder
  .inputRef<SubmitSuggestionInputPothosType>("SubmitSuggestionInput")
  .implement({
    description: "Input for submitting a new suggestion.",
    fields: t => ({
      submitterName: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

export type SuggestionFilterPothosType = {
  search?: string | null;
  status?: string | null;
  limit: number;
  offset: number;
};

export const SuggestionFilterPothosObject = gqlSchemaBuilder
  .inputRef<SuggestionFilterPothosType>("SuggestionFilter")
  .implement({
    description: "Filter and pagination options for the admin suggestion list.",
    fields: t => ({
      search: t.string({ required: false }),
      status: t.string({ required: false }),
      limit: t.int({ required: true }),
      offset: t.int({ required: true }),
    }),
  });

gqlSchemaBuilder.queryField("adminSuggestions", t =>
  t.field({
    type: AdminSuggestionResultPothosObject,
    description: "Returns the paginated admin suggestion list with metrics.",
    args: {
      filter: t.arg({ type: SuggestionFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result: AdminSuggestionResultType = await SuggestionService.getAdminSuggestions(
        ctx.user.id,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
          status: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        ctx.locale
      );

      return {
        id: "admin-suggestion-result",
        rows: result.suggestions.map((s: SuggestionSelectType) => ({
          ...s,
          parentName: "",
        })),
        metrics: {
          id: "suggestion-metrics",
          pending: result.pendingCount,
          reviewed: result.reviewedCount,
          avgResponseTime: null,
        },
        totalCount: result.totalCount,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("submitSuggestion", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Submits a new suggestion from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitSuggestionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const created = await SuggestionService.submitSuggestion(
        ctx.user.id,
        {
          submitterName: args.input.submitterName,
          body: args.input.body,
        },
        ctx.locale
      );

      return {
        ...created,
        parentName: "",
      };
    },
  })
);

gqlSchemaBuilder.mutationField("markSuggestionReviewed", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Marks a suggestion as reviewed (admin only).",
    args: {
      suggestionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const updated = await SuggestionService.markSuggestionReviewed(ctx.user.id, args.suggestionId, ctx.locale);

      return {
        ...updated,
        parentName: "",
      };
    },
  })
);
