import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PageInfoObject, PaginationArgsObject } from "@/backend/graphql/pothos/pagination.objects";
import { ComplaintService } from "@/backend/services";
import type {
  ComplaintFileReturnType,
  ComplaintMetrics,
  ComplaintQueueFilter,
  ComplaintQueuePaginatedResult,
  ComplaintQueueResult,
  ComplaintReturnType,
  ComplaintSelectType,
  ComplaintSubmitWithFilesInput,
  ParentComplaintPaginatedResult,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types";
import { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import { ComplaintResponsePothosObject } from "./complaintResponses.pothos";

export const ComplaintCategoryPothosEnum = gqlSchemaBuilder.enumType(ComplaintCategory, {
  name: "ComplaintCategory",
  description: "Categories for parent complaints.",
});

export const ComplaintStatusPothosEnum = gqlSchemaBuilder.enumType(ComplaintStatus, {
  name: "ComplaintStatus",
  description: "Status of a complaint in the support queue.",
});

const ComplaintFileRef = gqlSchemaBuilder.objectRef<ComplaintFileReturnType>("ComplaintFile");

export const ComplaintFilePothosObject = ComplaintFileRef.implement({
  description: "A file attached to a complaint.",
  fields: t => ({
    fileId: t.exposeString("fileId"),
    publicUrl: t.exposeString("publicUrl"),
    isProtected: t.exposeBoolean("isProtected"),
    usageType: t.exposeString("usageType"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const ComplaintRef = gqlSchemaBuilder.objectRef<ComplaintReturnType>("Complaint");

export const ComplaintPothosObject = ComplaintRef.implement({
  description: "A parent complaint with full details and responses.",
  fields: t => ({
    id: t.exposeString("id"),
    body: t.exposeString("body"),
    parentName: t.exposeString("parentName", { nullable: true }),
    parentAvatarUrl: t.exposeString("parentAvatarUrl", { nullable: true }),
    studentName: t.exposeString("studentName", { nullable: true }),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    responses: t.expose("responses", { type: [ComplaintResponsePothosObject], nullable: true }),
    files: t.expose("files", { type: [ComplaintFilePothosObject], nullable: true }),
  }),
});

const ComplaintMetricsRef = gqlSchemaBuilder.objectRef<ComplaintMetrics>("ComplaintMetrics");

export const ComplaintMetricsPothosObject = ComplaintMetricsRef.implement({
  description: "Aggregate metrics for the complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    unanswered: t.exposeInt("unanswered"),
    answered: t.exposeInt("answered"),
    avgResolutionHours: t.exposeInt("avgResolutionHours"),
    avgResolutionTime: t.exposeString("avgResolutionTime", { nullable: true }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

const AdminComplaintQueueResultRef = gqlSchemaBuilder.objectRef<ComplaintQueueResult>("ComplaintQueueResult");

export const ComplaintQueueResultPothosObject = AdminComplaintQueueResultRef.implement({
  description: "Paginated admin complaint queue with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    complaints: t.expose("complaints", { type: [ComplaintPothosObject] }),
    rows: t.expose("complaints", { type: [ComplaintPothosObject] }),
    metrics: t.expose("metrics", { type: ComplaintMetricsPothosObject }),
    totalCount: t.exposeInt("totalCount", { nullable: true }),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const ParentComplaintsResultRef = gqlSchemaBuilder.objectRef<ParentComplaintPaginatedResult>("ParentComplaintsResult");

export const ParentComplaintsResultPothosObject = ParentComplaintsResultRef.implement({
  description: "Paginated parent complaints with page info.",
  fields: t => ({
    id: t.exposeString("id"),
    complaints: t.expose("complaints", { type: [ComplaintPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const ComplaintQueuePaginatedResultRef = gqlSchemaBuilder.objectRef<ComplaintQueuePaginatedResult>(
  "ComplaintQueuePaginatedResult"
);

export const ComplaintQueuePaginatedResultPothosObject = ComplaintQueuePaginatedResultRef.implement({
  description: "Paginated result for the admin complaint queue.",
  fields: t => ({
    rows: t.expose("rows", { type: [ComplaintPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

const ComplaintFileMetadataInputRef = gqlSchemaBuilder.inputRef<{ path: string; mimeType: string; sizeBytes: number }>(
  "ComplaintFileMetadataInput"
);

export const ComplaintFileMetadataInputPothosObject = ComplaintFileMetadataInputRef.implement({
  description: "Input metadata for a pre-uploaded complaint attachment.",
  fields: t => ({
    path: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
    mimeType: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
    sizeBytes: t.int({ required: true }),
  }),
});

export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintSubmitWithFilesInput>("ComplaintSubmitInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      category: t.field({ type: ComplaintCategoryPothosEnum, required: true }),
      submitterEmail: t.string({ required: true, directives: { constraint: { maxLength: 254 } } }),
      body: t.string({ required: true, directives: { constraint: { maxLength: 5000 } } }),
      files: t.field({ type: [ComplaintFileMetadataInputPothosObject], required: false }),
    }),
  });

export const ComplaintQueueFilterPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintQueueFilter>("ComplaintQueueFilter")
  .implement({
    description: "Filter options for the admin complaint queue.",
    fields: t => ({
      search: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      status: t.field({ type: ComplaintStatusPothosEnum, required: false }),
    }),
  });

function normalizeComplaint(complaint: ComplaintReturnType): ComplaintReturnType {
  return {
    ...complaint,
    parentName: complaint.parentName ?? null,
    studentName: complaint.studentName ?? null,
    responseCount: complaint.responseCount ?? 0,
    responses: complaint.responses ?? [],
    files: complaint.files ?? [],
  };
}

gqlSchemaBuilder.queryField("parentComplaints", t =>
  t.field({
    type: ParentComplaintsResultPothosObject,
    authScopes: { loggedIn: true },
    description: "Returns the authenticated parent's complaint history with pagination.",
    args: {
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx): Promise<ParentComplaintPaginatedResult> => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

      const result = await ComplaintService.getParentComplaints(ctx.user.id, pagination, ctx.locale);

      return {
        id: result.id,
        complaints: result.complaints.map(normalizeComplaint),
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
  })
);

gqlSchemaBuilder.queryField("adminComplaintQueue", t =>
  t.field({
    type: ComplaintQueueResultPothosObject,
    authScopes: { superAdmin: true },
    description: "Returns the paginated admin complaint queue with metrics.",
    args: {
      filter: t.arg({ type: ComplaintQueueFilterPothosObject, required: true }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: async (_root, args, ctx): Promise<ComplaintQueueResult> => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const paginationArgs = args.paginationArgs
        ? new PaginationArgs({
            first: args.paginationArgs.first ?? null,
            skip: args.paginationArgs.skip ?? null,
            after: args.paginationArgs.after ?? null,
            before: args.paginationArgs.before ?? null,
            last: args.paginationArgs.last ?? null,
            page: args.paginationArgs.page ?? null,
            maxCount: args.paginationArgs.maxCount ?? null,
          })
        : null;

      const result = await ComplaintService.getQueueWithMetricsPaginated(
        ctx.user.id,
        {
          status: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        paginationArgs,
        ctx.locale
      );

      return {
        id: result.id,
        complaints: result.rows.map(normalizeComplaint),
        metrics: {
          id: result.metrics.id,
          unanswered: result.metrics.unanswered,
          answered: result.metrics.answered,
          avgResolutionHours: result.metrics.avgResolutionHours,
          avgResolutionTime: null,
          totalCount: result.metrics.totalCount,
        },
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
  })
);

gqlSchemaBuilder.queryField("complaintFiles", t =>
  t.field({
    type: [ComplaintFilePothosObject],
    authScopes: { loggedIn: true },
    description: "Returns file attachments for a specific complaint. Accessible by the owning parent or admins.",
    args: {
      complaintId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      return await ComplaintService.getComplaintFiles(ctx.user.id, args.complaintId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("submitComplaint", t =>
  t.field({
    type: ComplaintPothosObject,
    authScopes: { loggedIn: true },
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
          files: args.input.files ?? [],
        },
        ctx.locale
      );

      return normalizeComplaint({
        id: created.id,
        category: created.category as ComplaintCategory,
        body: created.body,
        status: created.status as ComplaintStatus,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        parentName: null,
        studentName: null,
        responseCount: 0,
        responses: [],
        files: [],
      });
    },
  })
);

gqlSchemaBuilder.mutationField("deleteComplaint", t =>
  t.field({
    type: "Boolean",
    authScopes: { superAdmin: true },
    description: "Soft-deletes a complaint (admin only). Returns true on success.",
    args: {
      complaintId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
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
