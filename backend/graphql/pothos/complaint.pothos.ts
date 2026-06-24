import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ComplaintService } from "@/backend/services";
import type {
  ComplaintMetrics,
  ComplaintQueueFilter,
  ComplaintQueueResult,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitInput,
} from "@/backend/types";
import { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";

export const ComplaintCategoryPothosEnum = gqlSchemaBuilder.enumType(ComplaintCategory, {
  name: "ComplaintCategory",
  description: "Categories for parent complaints.",
});

export const ComplaintStatusPothosEnum = gqlSchemaBuilder.enumType(ComplaintStatus, {
  name: "ComplaintStatus",
  description: "Status of a complaint in the support queue.",
});

const ComplaintRef = gqlSchemaBuilder.objectRef<ComplaintReturnType>("Complaint");

export const ComplaintPothosObject = ComplaintRef.implement({
  description: "A parent complaint with full details and responses.",
  fields: t => ({
    id: t.exposeString("id"),
    body: t.exposeString("body"),
    parentId: t.exposeString("parentId"),
    parentName: t.exposeString("parentName"),
    submitterEmail: t.exposeString("submitterEmail"),
    studentId: t.exposeString("studentId", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

const ComplaintMetricsRef = gqlSchemaBuilder.objectRef<ComplaintMetrics>("ComplaintMetrics");

export const ComplaintMetricsPothosObject = ComplaintMetricsRef.implement({
  description: "Aggregate metrics for the complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    unanswered: t.exposeInt("unanswered"),
    answered: t.exposeInt("answered"),
    avgResolutionTime: t.exposeString("avgResolutionTime", { nullable: true }),
  }),
});

const AdminComplaintQueueResultRef = gqlSchemaBuilder.objectRef<ComplaintQueueResult>("ComplaintQueueResult");

export const ComplaintQueueResultPothosObject = AdminComplaintQueueResultRef.implement({
  description: "Paginated admin complaint queue with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("complaints", { type: [ComplaintPothosObject] }),
    metrics: t.expose("metrics", { type: ComplaintMetricsPothosObject }),
  }),
});

export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintSubmitInput>("ComplaintSubmitInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: false }),
      category: t.field({ type: ComplaintCategoryPothosEnum, required: true }),
      submitterEmail: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

export const ComplaintQueueFilterPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintQueueFilter>("ComplaintQueueFilter")
  .implement({
    description: "Filter and pagination options for the admin complaint queue.",
    fields: t => ({
      search: t.string({ required: false }),
      status: t.field({ type: ComplaintStatusPothosEnum, required: false }),
      limit: t.int({ required: true }),
      offset: t.int({ required: true }),
    }),
  });

gqlSchemaBuilder.queryField("parentComplaints", t =>
  t.field({
    type: [ComplaintPothosObject],
    description: "Returns the authenticated parent's complaint history with responses.",
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      return await ComplaintService.getParentComplaints(ctx.user.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("adminComplaintQueue", t =>
  t.field({
    type: ComplaintQueueResultPothosObject,
    description: "Returns the paginated admin complaint queue with metrics.",
    args: {
      filter: t.arg({ type: ComplaintQueueFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result: ComplaintQueueResult = await ComplaintService.getQueueWithMetrics(
        ctx.user.id,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
          status: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        ctx.locale
      );

      const rows = result.complaints;

      return {
        id: "admin-complaint-queue",
        complaints: rows,
        metrics: {
          id: "complaint-metrics",
          unanswered: result.metrics.unanswered,
          answered: result.metrics.answered,
          avgResolutionTime: result.metrics.avgResolutionHours > 0 ? `${result.metrics.avgResolutionHours}h` : null,
          totalCount: result.totalCount,
        },
      };
    },
  })
);

gqlSchemaBuilder.mutationField("submitComplaint", t =>
  t.field({
    type: ComplaintPothosObject,
    description: "Submits a new complaint from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<ComplaintReturnType> => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const created: ComplaintSelectType = await ComplaintService.submitComplaint(
        ctx.user.id,
        {
          studentId: args.input.studentId ?? null,
          category: args.input.category,
          submitterEmail: args.input.submitterEmail,
          body: args.input.body,
        },
        ctx.locale
      );

      return {
        id: created.id,
        parentId: created.parentId,
        studentId: created.studentId ?? null,
        category: created.category as ComplaintCategory,
        submitterEmail: created.submitterEmail,
        body: created.body,
        status: created.status as ComplaintStatus,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        parentName: "",
        studentName: null,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("deleteComplaint", t =>
  t.field({
    type: "Boolean",
    description: "Soft-deletes a complaint (admin only). Returns true on success.",
    args: {
      complaintId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      await ComplaintService.deleteComplaint(ctx.user.id, args.complaintId, ctx.locale);

      return true;
    },
  })
);
