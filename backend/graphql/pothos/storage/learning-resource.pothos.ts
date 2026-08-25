import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type { LearningResourceReturnType } from "@/backend/types";

// ─── Input Types ──────────────────────────────────────────────────────────────

export const ResourceUploadInput = gqlSchemaBuilder.inputType("ResourceUploadInput", {
  fields: t => ({
    displayName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    filePath: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    fileId: t.id({ required: true }),
  }),
});

// ─── Object Types ─────────────────────────────────────────────────────────────

export const LearningResourceRowRef = gqlSchemaBuilder.objectRef<LearningResourceReturnType>("LearningResourceRow");

export const LearningResourceRowPothosObject = LearningResourceRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    displayName: t.exposeString("displayName"),
    filePath: t.exposeString("filePath"),
    uploadedByUserId: t.exposeString("uploadedByUserId"),
    uploadedByUserName: t.exposeString("uploadedByUserName", { nullable: true }),
    fileSize: t.exposeFloat("fileSize", { nullable: true }),
    contentType: t.exposeString("contentType", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── Queries & Mutations ─────────────────────────────────────────────────────────

/**
 * Mutation: deleteLearningResource
 * Permanently deletes a curriculum file and drops the DB record.
 */
