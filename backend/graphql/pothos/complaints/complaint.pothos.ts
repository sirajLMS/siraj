import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ComplaintResponsePothosObject } from "@/backend/graphql/pothos/complaints/complaintResponses.pothos";
import { ComplaintCategoryPothosEnum, ComplaintStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  ComplaintFileMetadataInput,
  ComplaintFileReturnType,
  ComplaintMetrics,
  ComplaintQueueFilter,
  ComplaintQueuePaginatedResult,
  ComplaintQueueResult,
  ComplaintReturnType,
  ComplaintSubmitWithFilesInput,
  ParentComplaintPaginatedResult,
} from "@/backend/types";

export const ComplaintFileRef = gqlSchemaBuilder.objectRef<ComplaintFileReturnType>("ComplaintFile");

export const ComplaintFilePothosObject = ComplaintFileRef.implement({
  description: "A file attached to a complaint.",
  fields: t => ({
    id: t.string({ resolve: parent => parent.fileId }),
    fileId: t.exposeString("fileId"),
    publicUrl: t.exposeString("publicUrl"),
    isProtected: t.exposeBoolean("isProtected"),
    usageType: t.exposeString("usageType"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

export const ComplaintRef = gqlSchemaBuilder.objectRef<ComplaintReturnType>("Complaint");

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

export const ComplaintMetricsRef = gqlSchemaBuilder.objectRef<ComplaintMetrics>("ComplaintMetrics");

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

export const AdminComplaintQueueResultRef = gqlSchemaBuilder.objectRef<ComplaintQueueResult>("ComplaintQueueResult");

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

export const ParentComplaintsResultRef =
  gqlSchemaBuilder.objectRef<ParentComplaintPaginatedResult>("ParentComplaintsResult");

export const ParentComplaintsResultPothosObject = ParentComplaintsResultRef.implement({
  description: "Paginated parent complaints with page info.",
  fields: t => ({
    id: t.exposeString("id"),
    complaints: t.expose("complaints", { type: [ComplaintPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const ComplaintQueuePaginatedResultRef = gqlSchemaBuilder.objectRef<ComplaintQueuePaginatedResult>(
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

export const ComplaintFileMetadataInputRef =
  gqlSchemaBuilder.inputRef<ComplaintFileMetadataInput>("ComplaintFileMetadataInput");

export const ComplaintFileMetadataInputPothosObject = ComplaintFileMetadataInputRef.implement({
  description: "Input metadata for a pre-uploaded complaint attachment.",
  fields: t => ({
    path: t.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
    mimeType: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
    sizeBytes: t.int({ required: true, directives: { constraint: { max: 104857600 } } }),
  }),
});

export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintSubmitWithFilesInput>("ComplaintSubmitInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
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

export function normalizeComplaint(complaint: ComplaintReturnType): ComplaintReturnType {
  return {
    ...complaint,
    parentName: complaint.parentName ?? null,
    studentName: complaint.studentName ?? null,
    responseCount: complaint.responseCount ?? 0,
    responses: complaint.responses ?? [],
    files: complaint.files ?? [],
  };
}
