import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ComplaintCategory,
  ComplaintStatus,
} from "@/shared/lib/enum";
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import type {
  AdminComplaintQueueResultType,
  ComplaintQueueRowType,
  ComplaintResponseSelectType,
  ComplaintSelectType,
  ComplaintWithResponsesType,
} from "@/backend/types/communications.types";

export const ComplaintCategoryPothosEnum = gqlSchemaBuilder.enumType(ComplaintCategory, {
  name: "ComplaintCategory",
  description: "Categories for parent complaints.",
});

export const ComplaintStatusPothosEnum = gqlSchemaBuilder.enumType(ComplaintStatus, {
  name: "ComplaintStatus",
  description: "Status of a complaint in the support queue.",
});

export type ComplaintResponsePothosType = {
  id: string;
  complaintId: string;
  responderUserId: string | null;
  body: string;
  emailSent: boolean;
  createdAt: Date;
  responderName: string | null;
};

const ComplaintResponseRef = gqlSchemaBuilder.objectRef<ComplaintResponsePothosType>("ComplaintResponse");

export const ComplaintResponsePothosObject = ComplaintResponseRef.implement({
  description: "A single response to a complaint.",
  fields: t => ({
    id: t.exposeString("id"),
    complaintId: t.exposeString("complaintId"),
    responderUserId: t.exposeString("responderUserId", { nullable: true }),
    body: t.exposeString("body"),
    emailSent: t.exposeBoolean("emailSent"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    responderName: t.exposeString("responderName", { nullable: true }),
  }),
});

export type ComplaintPothosType = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  parentName: string;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponsePothosType>;
};

const ComplaintRef = gqlSchemaBuilder.objectRef<ComplaintPothosType>("Complaint");

export const ComplaintPothosObject = ComplaintRef.implement({
  description: "A parent complaint with full details and responses.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    submitterEmail: t.exposeString("submitterEmail"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
    studentName: t.exposeString("studentName", { nullable: true }),
    responses: t.expose("responses", { type: [ComplaintResponsePothosObject] }),
  }),
});

export type ParentComplaintRecordPothosType = {
  id: string;
  category: ComplaintCategory;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  studentName: string | null;
  responses: ReadonlyArray<ComplaintResponsePothosType>;
};

const ParentComplaintRecordRef =
  gqlSchemaBuilder.objectRef<ParentComplaintRecordPothosType>("ParentComplaintRecord");

export const ParentComplaintRecordPothosObject = ParentComplaintRecordRef.implement({
  description: "A parent-facing view of a single complaint record.",
  fields: t => ({
    id: t.exposeString("id"),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    studentName: t.exposeString("studentName", { nullable: true }),
    responses: t.expose("responses", { type: [ComplaintResponsePothosObject] }),
  }),
});

export type ComplaintQueueRowPothosType = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  parentName: string;
  studentName: string | null;
  responseCount: number;
};

const ComplaintQueueRowRef = gqlSchemaBuilder.objectRef<ComplaintQueueRowPothosType>("ComplaintQueueRow");

export const ComplaintQueueRowPothosObject = ComplaintQueueRowRef.implement({
  description: "A single row in the admin complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    submitterEmail: t.exposeString("submitterEmail"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
    studentName: t.exposeString("studentName", { nullable: true }),
    responseCount: t.exposeInt("responseCount"),
  }),
});

export type ComplaintMetricsPothosType = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionTime: string | null;
};

const ComplaintMetricsRef = gqlSchemaBuilder.objectRef<ComplaintMetricsPothosType>("ComplaintMetrics");

export const ComplaintMetricsPothosObject = ComplaintMetricsRef.implement({
  description: "Aggregate metrics for the complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    unanswered: t.exposeInt("unanswered"),
    answered: t.exposeInt("answered"),
    avgResolutionTime: t.exposeString("avgResolutionTime", { nullable: true }),
  }),
});

export type AdminComplaintQueueResultPothosType = {
  id: string;
  rows: ReadonlyArray<ComplaintQueueRowPothosType>;
  metrics: ComplaintMetricsPothosType;
  totalCount: number;
};

const AdminComplaintQueueResultRef =
  gqlSchemaBuilder.objectRef<AdminComplaintQueueResultPothosType>("AdminComplaintQueueResult");

export const AdminComplaintQueueResultPothosObject = AdminComplaintQueueResultRef.implement({
  description: "Paginated admin complaint queue with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ComplaintQueueRowPothosObject] }),
    metrics: t.expose("metrics", { type: ComplaintMetricsPothosObject }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

export type SubmitComplaintInputPothosType = {
  studentId?: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
};

export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<SubmitComplaintInputPothosType>("SubmitComplaintInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: false }),
      category: t.field({ type: ComplaintCategoryPothosEnum, required: true }),
      submitterEmail: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

export type RespondToComplaintInputPothosType = {
  complaintId: string;
  body: string;
  sendEmail: boolean;
};

export const RespondToComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<RespondToComplaintInputPothosType>("RespondToComplaintInput")
  .implement({
    description: "Input for responding to a complaint.",
    fields: t => ({
      complaintId: t.string({ required: true }),
      body: t.string({ required: true }),
      sendEmail: t.boolean({ required: true }),
    }),
  });

export type ComplaintQueueFilterPothosType = {
  search?: string | null;
  status?: ComplaintStatus | null;
  limit: number;
  offset: number;
};

export const ComplaintQueueFilterPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintQueueFilterPothosType>("ComplaintQueueFilter")
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
    type: [ParentComplaintRecordPothosObject],
    description: "Returns the authenticated parent's complaint history with responses.",
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const complaints = await ComplaintService.getParentComplaints(ctx.user.id, ctx.locale);

      return complaints.map((c: ComplaintWithResponsesType): ParentComplaintRecordPothosType => ({
        id: c.id,
        category: c.category as ComplaintCategory,
        body: c.body,
        status: c.status as ComplaintStatus,
        createdAt: c.createdAt,
        studentName: c.studentName,
        responses: c.responses.map((r: ComplaintResponseSelectType): ComplaintResponsePothosType => ({
          id: r.id,
          complaintId: r.complaintId,
          responderUserId: r.responderUserId ?? null,
          body: r.body,
          emailSent: r.emailSent,
          createdAt: r.createdAt,
          responderName: null,
        })),
      }));
    },
  })
);

gqlSchemaBuilder.queryField("adminComplaintQueue", t =>
  t.field({
    type: AdminComplaintQueueResultPothosObject,
    description: "Returns the paginated admin complaint queue with metrics.",
    args: {
      filter: t.arg({ type: ComplaintQueueFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result: AdminComplaintQueueResultType = await ComplaintService.getAdminQueueWithMetrics(
        ctx.user.id,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
          statusFilter: args.filter.status ?? null,
          search: args.filter.search ?? null,
        },
        ctx.locale
      );

      const rows: ComplaintQueueRowPothosType[] = result.complaints.map((c: ComplaintQueueRowType) => ({
        id: c.id,
        parentId: c.parentId,
        studentId: c.studentId,
        category: c.category as ComplaintCategory,
        submitterEmail: c.submitterEmail,
        body: c.body,
        status: c.status as ComplaintStatus,
        createdAt: c.createdAt,
        parentName: c.parentName ?? "",
        studentName: c.studentName,
        responseCount: c.responseCount,
      }));

      return {
        id: "admin-complaint-queue",
        rows,
        metrics: {
          id: "complaint-metrics",
          unanswered: result.metrics.unanswered,
          answered: result.metrics.answered,
          avgResolutionTime: result.metrics.avgResolutionHours > 0
            ? `${result.metrics.avgResolutionHours}h`
            : null,
        },
        totalCount: result.totalCount,
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
    resolve: async (_root, args, ctx): Promise<ComplaintPothosType> => {
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
        category: created.category,
        submitterEmail: created.submitterEmail,
        body: created.body,
        status: created.status,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        parentName: "",
        studentName: null,
        responses: [],
      };
    },
  })
);

gqlSchemaBuilder.mutationField("respondToComplaint", t =>
  t.field({
    type: ComplaintResponsePothosObject,
    description: "Creates a response to an existing complaint (admin only).",
    args: {
      input: t.arg({ type: RespondToComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const response = await ComplaintService.respondToComplaint(
        ctx.user.id,
        args.input.complaintId,
        args.input.body,
        args.input.sendEmail,
        ctx.locale
      );

      return {
        id: response.id,
        complaintId: response.complaintId,
        responderUserId: response.responderUserId ?? null,
        body: response.body,
        emailSent: response.emailSent,
        createdAt: response.createdAt,
        responderName: null,
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